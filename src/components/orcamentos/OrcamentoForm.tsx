import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  Save,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useLeads } from "@/hooks/useLeads";
import { useProdutos } from "@/hooks/useEstoque";
import { useCreateOrcamento, useUpdateOrcamento, useBulkCreateOrcamentoItens, Orcamento, OrcamentoItemInsert } from "@/hooks/useOrcamentos";
import { maskCPFCNPJ, unmask } from "@/lib/masks";
import { useViaCep } from "@/hooks/useViaCep";

interface CartItem {
  produto_id: string;
  produto_nome: string;
  produto_sku: string;
  unidade_medida: string;
  quantidade: number;
  preco_unitario: number;
  desconto_percentual: number;
  desconto_valor: number;
  valor_total: number;
  estoque_disponivel: number;
}

interface OrcamentoFormProps {
  orcamento?: Orcamento | null;
  onBack: () => void;
  onSuccess: () => void;
}

export function OrcamentoForm({ orcamento, onBack, onSuccess }: OrcamentoFormProps) {
  const [clienteNome, setClienteNome] = useState(orcamento?.cliente_nome || "");
  const [clienteCnpj, setClienteCnpj] = useState(orcamento?.cliente_cnpj || "");
  const [docType, setDocType] = useState<"cpf" | "cnpj">("cnpj");
  const [clienteTelefone, setClienteTelefone] = useState(orcamento?.cliente_telefone || "");
  const [clienteEmail, setClienteEmail] = useState(orcamento?.cliente_email || "");
  const [clienteEndereco, setClienteEndereco] = useState(orcamento?.cliente_endereco || "");
  const [clienteCep, setClienteCep] = useState("");
  const [clienteLogradouro, setClienteLogradouro] = useState("");
  const [clienteNumero, setClienteNumero] = useState("");
  const [clienteComplemento, setClienteComplemento] = useState("");
  const [clienteBairro, setClienteBairro] = useState("");
  const [clienteCidade, setClienteCidade] = useState("");
  const [clienteUf, setClienteUf] = useState("");
  const [leadId, setLeadId] = useState<string | null>(orcamento?.lead_id || null);
  const [observacoes, setObservacoes] = useState(orcamento?.observacoes || "");
  const [validadeDias, setValidadeDias] = useState(orcamento?.validade_dias || 30);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [leadSearchOpen, setLeadSearchOpen] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");

  const { fetchAddress, isLoading: isLoadingCep } = useViaCep();

  const { data: leads } = useLeads();
  const { data: produtos } = useProdutos();
  const { mutateAsync: createOrcamento, isPending: isCreating } = useCreateOrcamento();
  const { mutateAsync: updateOrcamento, isPending: isUpdating } = useUpdateOrcamento();
  const { mutateAsync: bulkCreateItems } = useBulkCreateOrcamentoItens();

  const isEditing = !!orcamento;
  const isPending = isCreating || isUpdating;

  const filteredLeads = leads?.filter(
    (lead) =>
      lead.empresa?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.nome_contato?.toLowerCase().includes(leadSearch.toLowerCase()) ||
      lead.cnpj?.includes(leadSearch)
  ) || [];

  const handleSelectLead = (lead: typeof leads extends (infer U)[] | undefined ? U : never) => {
    if (!lead) return;
    setLeadId(lead.id);
    setClienteNome(lead.empresa || lead.nome_contato || "");
    setClienteCnpj(lead.cnpj || "");
    setClienteTelefone(lead.telefone || "");
    setClienteEmail(lead.email || "");
    setClienteEndereco(lead.localizacao || "");
    setLeadSearchOpen(false);
  };

  const handleAddProduct = (produto: NonNullable<typeof produtos>[number]) => {
    const existingItem = cartItems.find((item) => item.produto_id === produto.id);
    
    if (existingItem) {
      if (existingItem.quantidade >= produto.quantidade_estoque) {
        toast.error("Quantidade máxima em estoque atingida");
        return;
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.produto_id === produto.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                valor_total: (item.quantidade + 1) * item.preco_unitario * (1 - item.desconto_percentual / 100),
              }
            : item
        )
      );
    } else {
      setCartItems((prev) => [
        ...prev,
        {
          produto_id: produto.id,
          produto_nome: produto.nome,
          produto_sku: produto.sku,
          unidade_medida: produto.unidade_medida,
          quantidade: 1,
          preco_unitario: produto.preco_venda,
          desconto_percentual: 0,
          desconto_valor: 0,
          valor_total: produto.preco_venda,
          estoque_disponivel: produto.quantidade_estoque,
        },
      ]);
    }
    setProductSearchOpen(false);
  };

  const updateCartItem = (index: number, field: keyof CartItem, value: number) => {
    setCartItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        
        const updated = { ...item, [field]: value };
        
        // Recalculate total
        if (field === "quantidade" || field === "preco_unitario" || field === "desconto_percentual") {
          const subtotal = updated.quantidade * updated.preco_unitario;
          updated.desconto_valor = subtotal * (updated.desconto_percentual / 100);
          updated.valor_total = subtotal - updated.desconto_valor;
        }
        
        return updated;
      })
    );
  };

  const removeCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);
  const descontoTotal = cartItems.reduce((sum, item) => sum + item.desconto_valor, 0);
  const valorTotal = subtotal - descontoTotal;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!clienteNome.trim()) {
      toast.error("Informe o nome do cliente");
      return;
    }

    if (clienteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail)) {
      toast.error("E-mail inválido. Verifique o formato (ex: nome@dominio.com)");
      return;
    }
    
    if (cartItems.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    // Check stock availability
    for (const item of cartItems) {
      if (item.quantidade > item.estoque_disponivel) {
        toast.error(`Estoque insuficiente para ${item.produto_nome}`);
        return;
      }
    }

    const dataValidade = addDays(new Date(), validadeDias);

    // Build full address from parts
    const enderecoCompleto = [clienteLogradouro, clienteNumero, clienteComplemento, clienteBairro, clienteCidade, clienteUf].filter(Boolean).join(", ");

    const orcamentoData = {
      lead_id: leadId,
      cliente_nome: clienteNome,
      cliente_cnpj: clienteCnpj || null,
      cliente_telefone: clienteTelefone || null,
      cliente_email: clienteEmail || null,
      cliente_endereco: enderecoCompleto || clienteEndereco || null,
      status: orcamento?.status || "Pendente",
      subtotal,
      desconto_total: descontoTotal,
      valor_total: valorTotal,
      observacoes: observacoes || null,
      validade_dias: validadeDias,
      data_validade: format(dataValidade, "yyyy-MM-dd"),
    };

    try {
      if (isEditing) {
        await updateOrcamento({ id: orcamento.id, data: orcamentoData });
      } else {
        const newOrcamento = await createOrcamento(orcamentoData);
        
        // Create items
        const itemsData: Omit<OrcamentoItemInsert, 'orcamento_id'>[] = cartItems.map((item) => ({
          produto_id: item.produto_id,
          produto_nome: item.produto_nome,
          produto_sku: item.produto_sku,
          unidade_medida: item.unidade_medida,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          desconto_percentual: item.desconto_percentual,
          desconto_valor: item.desconto_valor,
          valor_total: item.valor_total,
        }));

        await bulkCreateItems({ orcamentoId: newOrcamento.id, items: itemsData });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving orcamento:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {isEditing ? `Editar Orçamento #${orcamento.numero_orcamento}` : "Novo Orçamento"}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize as informações do orçamento" : "Preencha os dados para criar um novo orçamento"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Data */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lead Search */}
            <div>
              <Label>Buscar Lead Existente</Label>
              <Popover open={leadSearchOpen} onOpenChange={setLeadSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Search className="h-4 w-4" />
                    {leadId ? "Lead selecionado" : "Selecionar lead..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar por empresa, contato ou CNPJ..."
                      value={leadSearch}
                      onValueChange={setLeadSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum lead encontrado</CommandEmpty>
                      <CommandGroup>
                        {filteredLeads.slice(0, 10).map((lead) => (
                          <CommandItem
                            key={lead.id}
                            onSelect={() => handleSelectLead(lead)}
                            className="cursor-pointer"
                          >
                            <div>
                              <p className="font-medium">{lead.empresa || lead.nome_contato}</p>
                              <p className="text-xs text-muted-foreground">
                                {lead.cnpj} • {lead.telefone}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="mt-1 text-xs text-muted-foreground">
                Ou preencha manualmente para venda de balcão
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Nome / Empresa */}
              <div className="space-y-2">
                <Label htmlFor="cliente_nome" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Nome / Empresa *
                </Label>
                <Input
                  id="cliente_nome"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome do cliente ou empresa"
                />
              </div>

              {/* CPF/CNPJ with discrete switch */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="cliente_cnpj">
                    {docType === "cpf" ? "CPF" : "CNPJ"}
                  </Label>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-medium transition-opacity ${docType === "cpf" ? "text-foreground opacity-100" : "text-muted-foreground opacity-50"}`}>CPF</span>
                    <Switch
                      checked={docType === "cnpj"}
                      onCheckedChange={(checked) => {
                        setDocType(checked ? "cnpj" : "cpf");
                        setClienteCnpj("");
                      }}
                      className="h-4 w-8 data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary border border-border [&>span]:h-3 [&>span]:w-3 [&>span]:bg-white [&>span]:shadow-sm [&>span]:data-[state=checked]:translate-x-4"
                    />
                    <span className={`text-[10px] font-medium transition-opacity ${docType === "cnpj" ? "text-foreground opacity-100" : "text-muted-foreground opacity-50"}`}>CNPJ</span>
                  </div>
                </div>
                <Input
                  id="cliente_cnpj"
                  value={clienteCnpj}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const masked = maskCPFCNPJ(raw, docType);
                    setClienteCnpj(masked);
                  }}
                  placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                  maxLength={docType === "cpf" ? 14 : 18}
                />
              </div>

              {/* Telefone with mask */}
              <div className="space-y-2">
                <Label htmlFor="cliente_telefone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  id="cliente_telefone"
                  value={clienteTelefone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                    let formatted = digits;
                    if (digits.length > 2) {
                      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
                    }
                    if (digits.length > 7) {
                      formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
                    }
                    setClienteTelefone(formatted);
                  }}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>

              {/* Email with validation */}
              <div className="space-y-2">
                <Label htmlFor="cliente_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="cliente_email"
                  type="email"
                  value={clienteEmail}
                  onChange={(e) => setClienteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className={clienteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail) ? "border-destructive" : ""}
                />
                {clienteEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteEmail) && (
                  <p className="text-xs text-destructive">E-mail inválido</p>
                )}
              </div>
            </div>

            {/* Address Grid with ViaCEP */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Endereço
              </Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <Label htmlFor="cliente_cep" className="text-xs text-muted-foreground">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cliente_cep"
                      value={clienteCep}
                      onChange={async (e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                        const formatted = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
                        setClienteCep(formatted);
                        if (v.length === 8) {
                          const addr = await fetchAddress(v);
                          if (addr) {
                            setClienteLogradouro(addr.logradouro);
                            setClienteBairro(addr.bairro);
                            setClienteCidade(addr.localidade);
                            setClienteUf(addr.uf);
                          }
                        }
                      }}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                    {isLoadingCep && <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                  </div>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="cliente_logradouro" className="text-xs text-muted-foreground">Logradouro</Label>
                  <Input id="cliente_logradouro" value={clienteLogradouro} onChange={(e) => setClienteLogradouro(e.target.value)} placeholder="Rua, Avenida..." />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label htmlFor="cliente_numero" className="text-xs text-muted-foreground">Número</Label>
                  <Input id="cliente_numero" value={clienteNumero} onChange={(e) => setClienteNumero(e.target.value)} placeholder="Nº" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cliente_complemento" className="text-xs text-muted-foreground">Complemento</Label>
                  <Input id="cliente_complemento" value={clienteComplemento} onChange={(e) => setClienteComplemento(e.target.value)} placeholder="Apto, Sala..." />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cliente_bairro" className="text-xs text-muted-foreground">Bairro</Label>
                  <Input id="cliente_bairro" value={clienteBairro} onChange={(e) => setClienteBairro(e.target.value)} placeholder="Bairro" />
                </div>
                <div className="space-y-1 grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="cliente_cidade" className="text-xs text-muted-foreground">Cidade</Label>
                    <Input id="cliente_cidade" value={clienteCidade} onChange={(e) => setClienteCidade(e.target.value)} placeholder="Cidade" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cliente_uf" className="text-xs text-muted-foreground">UF</Label>
                    <Input id="cliente_uf" value={clienteUf} onChange={(e) => setClienteUf(e.target.value)} placeholder="UF" maxLength={2} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Validity and Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Validade (dias)</Label>
              <Select
                value={String(validadeDias)}
                onValueChange={(v) => setValidadeDias(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="45">45 dias</SelectItem>
                  <SelectItem value="60">60 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Condições de pagamento, observações gerais..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos
          </CardTitle>
          <Popover open={productSearchOpen} onOpenChange={setProductSearchOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Produto
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[500px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Buscar produto por nome ou SKU..." />
                <CommandList>
                  <CommandEmpty>Nenhum produto encontrado</CommandEmpty>
                  <CommandGroup>
                    {produtos?.filter((p) => p.ativo && p.quantidade_estoque > 0).map((produto) => (
                      <CommandItem
                        key={produto.id}
                        onSelect={() => handleAddProduct(produto)}
                        className="cursor-pointer"
                      >
                        <div className="flex w-full items-center justify-between">
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {produto.sku} • Estoque: {produto.quantidade_estoque} {produto.unidade_medida}
                            </p>
                          </div>
                          <span className="font-semibold text-primary">
                            {formatCurrency(produto.preco_venda)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </CardHeader>
        <CardContent>
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum produto adicionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="w-[100px]">Qtd</TableHead>
                    <TableHead className="w-[130px]">Preço Unit.</TableHead>
                    <TableHead className="w-[100px]">Desc. %</TableHead>
                    <TableHead className="w-[130px] text-right">Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.produto_nome}</p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.produto_sku} • Estoque: {item.estoque_disponivel}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          max={item.estoque_disponivel}
                          value={item.quantidade}
                          onChange={(e) => updateCartItem(index, "quantidade", Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.preco_unitario}
                          onChange={(e) => updateCartItem(index, "preco_unitario", Number(e.target.value))}
                          className="w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={item.desconto_percentual}
                          onChange={(e) => updateCartItem(index, "desconto_percentual", Number(e.target.value))}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.valor_total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCartItem(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Totals */}
          {cartItems.length > 0 && (
            <div className="mt-6 flex justify-end border-t pt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Descontos:</span>
                  <span className="text-destructive">-{formatCurrency(descontoTotal)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">{formatCurrency(valorTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Orçamento"}
        </Button>
      </div>
    </div>
  );
}
