import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  Package,
  Save,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useProdutos } from "@/hooks/useEstoque";
import { useCreateNotaFiscal, useUpdateNotaFiscal, useBulkCreateNotaFiscalItens, NotaFiscal, NotaFiscalItemInsert } from "@/hooks/useNotasFiscais";
import { useOrcamento, useOrcamentoItens, Orcamento } from "@/hooks/useOrcamentos";

interface NotaItem {
  produto_id: string;
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  cst_csosn: string;
  origem: number;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  base_icms: number;
  aliquota_icms: number;
  valor_icms: number;
}

interface NotaFiscalFormProps {
  nota?: NotaFiscal | null;
  orcamentoId?: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

export function NotaFiscalForm({ nota, orcamentoId, onBack, onSuccess }: NotaFiscalFormProps) {
  // Emitente (default values)
  const [emitenteRazaoSocial, setEmitenteRazaoSocial] = useState(nota?.emitente_razao_social || "Acqua Nobilis Ltda");
  const [emitenteCnpj, setEmitenteCnpj] = useState(nota?.emitente_cnpj || "00.000.000/0001-00");
  const [emitenteEndereco, setEmitenteEndereco] = useState(nota?.emitente_endereco || "Endereço da Empresa");
  const [emitenteCidade, setEmitenteCidade] = useState(nota?.emitente_cidade || "São Paulo");
  const [emitenteUf, setEmitenteUf] = useState(nota?.emitente_uf || "SP");
  const [emitenteCep, setEmitenteCep] = useState(nota?.emitente_cep || "00000-000");
  const [emitenteIe, setEmitenteIe] = useState(nota?.emitente_ie || "ISENTO");

  // Destinatário
  const [destinatarioNome, setDestinatarioNome] = useState(nota?.destinatario_nome || "");
  const [destinatarioCnpj, setDestinatarioCnpj] = useState(nota?.destinatario_cnpj || "");
  const [destinatarioEndereco, setDestinatarioEndereco] = useState(nota?.destinatario_endereco || "");
  const [destinatarioCidade, setDestinatarioCidade] = useState(nota?.destinatario_cidade || "");
  const [destinatarioUf, setDestinatarioUf] = useState(nota?.destinatario_uf || "");
  const [destinatarioCep, setDestinatarioCep] = useState(nota?.destinatario_cep || "");
  const [destinatarioTelefone, setDestinatarioTelefone] = useState(nota?.destinatario_telefone || "");
  const [destinatarioEmail, setDestinatarioEmail] = useState(nota?.destinatario_email || "");
  const [destinatarioIe, setDestinatarioIe] = useState(nota?.destinatario_ie || "");

  // Dados da Nota
  const [naturezaOperacao, setNaturezaOperacao] = useState(nota?.natureza_operacao || "Venda de Mercadoria");
  const [informacoesAdicionais, setInformacoesAdicionais] = useState(nota?.informacoes_adicionais || "");
  const [observacoesFisco, setObservacoesFisco] = useState(nota?.observacoes_fisco || "");

  // Configurações de Emissão
  const [serieNota, setSerieNota] = useState("001");
  const [cfopPadrao, setCfopPadrao] = useState("5102");

  // Valores extras
  const [valorFrete, setValorFrete] = useState(nota?.valor_frete || 0);
  const [valorSeguro, setValorSeguro] = useState(nota?.valor_seguro || 0);
  const [valorOutrasDespesas, setValorOutrasDespesas] = useState(nota?.valor_outras_despesas || 0);

  // Items
  const [items, setItems] = useState<NotaItem[]>([]);
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  const { data: produtos } = useProdutos();
  const { data: orcamento } = useOrcamento(orcamentoId || null);
  const { data: orcamentoItens } = useOrcamentoItens(orcamentoId || null);
  const { mutateAsync: createNota, isPending: isCreating } = useCreateNotaFiscal();
  const { mutateAsync: updateNota, isPending: isUpdating } = useUpdateNotaFiscal();
  const { mutateAsync: bulkCreateItems } = useBulkCreateNotaFiscalItens();

  const isEditing = !!nota;
  const isPending = isCreating || isUpdating;

  // Preencher dados do orçamento quando disponível
  useEffect(() => {
    if (orcamento && !nota) {
      setDestinatarioNome(orcamento.cliente_nome || "");
      setDestinatarioCnpj(orcamento.cliente_cnpj || "");
      setDestinatarioEndereco(orcamento.cliente_endereco || "");
      setDestinatarioTelefone(orcamento.cliente_telefone || "");
      setDestinatarioEmail(orcamento.cliente_email || "");
    }
  }, [orcamento, nota]);

  // Preencher itens do orçamento
  useEffect(() => {
    if (orcamentoItens && orcamentoItens.length > 0 && items.length === 0 && !nota) {
      const orcItems: NotaItem[] = orcamentoItens.map((item) => ({
        produto_id: item.produto_id,
        codigo: item.produto_sku,
        descricao: item.produto_nome,
        ncm: "00000000",
        cfop: cfopPadrao,
        cst_csosn: "102",
        origem: 0,
        unidade: item.unidade_medida,
        quantidade: item.quantidade,
        valor_unitario: item.preco_unitario,
        valor_total: item.valor_total,
        base_icms: item.valor_total,
        aliquota_icms: 18,
        valor_icms: item.valor_total * 0.18,
      }));
      setItems(orcItems);
    }
  }, [orcamentoItens, items.length, nota, cfopPadrao]);

  const handleAddProduct = (produto: NonNullable<typeof produtos>[number]) => {
    const existingItem = items.find((item) => item.produto_id === produto.id);
    
    if (existingItem) {
      setItems((prev) =>
        prev.map((item) =>
          item.produto_id === produto.id
            ? {
                ...item,
                quantidade: item.quantidade + 1,
                valor_total: (item.quantidade + 1) * item.valor_unitario,
                base_icms: (item.quantidade + 1) * item.valor_unitario,
                valor_icms: (item.quantidade + 1) * item.valor_unitario * (item.aliquota_icms / 100),
              }
            : item
        )
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          produto_id: produto.id,
          codigo: produto.sku,
          descricao: produto.nome,
          ncm: produto.ncm || "00000000",
          cfop: cfopPadrao,
          cst_csosn: produto.cst_csosn || "102",
          origem: produto.origem_mercadoria ?? 0,
          unidade: produto.unidade_medida,
          quantidade: 1,
          valor_unitario: produto.preco_venda,
          valor_total: produto.preco_venda,
          base_icms: produto.preco_venda,
          aliquota_icms: 18,
          valor_icms: produto.preco_venda * 0.18,
        },
      ]);
    }
    setProductSearchOpen(false);
  };

  const updateItem = (index: number, field: keyof NotaItem, value: number) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        
        const updated = { ...item, [field]: value };
        
        if (field === "quantidade" || field === "valor_unitario") {
          updated.valor_total = updated.quantidade * updated.valor_unitario;
          updated.base_icms = updated.valor_total;
          updated.valor_icms = updated.valor_total * (updated.aliquota_icms / 100);
        }
        
        if (field === "aliquota_icms") {
          updated.valor_icms = updated.base_icms * (value / 100);
        }
        
        return updated;
      })
    );
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const valorProdutos = items.reduce((sum, item) => sum + item.valor_total, 0);
  const valorDesconto = orcamento?.desconto_total || 0;
  const valorTotal = valorProdutos + valorFrete + valorSeguro + valorOutrasDespesas - valorDesconto;
  const totalIcms = items.reduce((sum, item) => sum + item.valor_icms, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleSubmit = async () => {
    if (!destinatarioNome.trim()) {
      toast.error("Informe o nome do destinatário");
      return;
    }
    
    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    const notaData = {
      orcamento_id: orcamentoId || null,
      emitente_razao_social: emitenteRazaoSocial,
      emitente_cnpj: emitenteCnpj,
      emitente_endereco: emitenteEndereco,
      emitente_cidade: emitenteCidade,
      emitente_uf: emitenteUf,
      emitente_cep: emitenteCep,
      emitente_telefone: null,
      emitente_ie: emitenteIe,
      destinatario_nome: destinatarioNome,
      destinatario_cnpj: destinatarioCnpj || null,
      destinatario_endereco: destinatarioEndereco || null,
      destinatario_cidade: destinatarioCidade || null,
      destinatario_uf: destinatarioUf || null,
      destinatario_cep: destinatarioCep || null,
      destinatario_telefone: destinatarioTelefone || null,
      destinatario_email: destinatarioEmail || null,
      destinatario_ie: destinatarioIe || null,
      chave_acesso: null,
      natureza_operacao: naturezaOperacao,
      data_emissao: new Date().toISOString(),
      data_saida: null,
      valor_produtos: valorProdutos,
      valor_frete: valorFrete,
      valor_seguro: valorSeguro,
      valor_desconto: valorDesconto,
      valor_outras_despesas: valorOutrasDespesas,
      valor_total: valorTotal,
      base_calculo_icms: valorProdutos,
      valor_icms: totalIcms,
      base_calculo_icms_st: 0,
      valor_icms_st: 0,
      valor_ipi: 0,
      valor_pis: 0,
      valor_cofins: 0,
      valor_total_tributos: totalIcms,
      informacoes_adicionais: informacoesAdicionais || null,
      observacoes_fisco: observacoesFisco || null,
      status: nota?.status || "Rascunho",
    };

    try {
      if (isEditing) {
        await updateNota({ id: nota.id, data: notaData });
      } else {
        const newNota = await createNota(notaData);
        
        const itemsData: Omit<NotaFiscalItemInsert, 'nota_fiscal_id'>[] = items.map((item) => ({
          produto_id: item.produto_id,
          codigo: item.codigo,
          descricao: item.descricao,
          ncm: item.ncm,
          cfop: item.cfop,
          unidade: item.unidade,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_total: item.valor_total,
          base_icms: item.base_icms,
          aliquota_icms: item.aliquota_icms,
          valor_icms: item.valor_icms,
          aliquota_ipi: 0,
          valor_ipi: 0,
        }));

        await bulkCreateItems({ notaFiscalId: newNota.id, items: itemsData });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving nota fiscal:", error);
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
            {isEditing ? `Editar NF-e #${nota.numero_nota}` : orcamentoId ? "Gerar NF-e do Orçamento" : "Nova Nota Fiscal Manual"}
          </h2>
          <p className="text-muted-foreground">
            {isEditing ? "Atualize as informações da nota fiscal" : "Preencha os dados para emitir a nota fiscal"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Emitente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados do Emitente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Razão Social</Label>
                <Input
                  value={emitenteRazaoSocial}
                  onChange={(e) => setEmitenteRazaoSocial(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={emitenteCnpj}
                  onChange={(e) => setEmitenteCnpj(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Inscrição Estadual</Label>
                <Input
                  value={emitenteIe}
                  onChange={(e) => setEmitenteIe(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={emitenteEndereco}
                  onChange={(e) => setEmitenteEndereco(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={emitenteCidade}
                  onChange={(e) => setEmitenteCidade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  value={emitenteUf}
                  onChange={(e) => setEmitenteUf(e.target.value)}
                  maxLength={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Destinatário */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Dados do Destinatário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Nome / Razão Social *</Label>
                <Input
                  value={destinatarioNome}
                  onChange={(e) => setDestinatarioNome(e.target.value)}
                  placeholder="Nome do destinatário"
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ / CPF</Label>
                <Input
                  value={destinatarioCnpj}
                  onChange={(e) => setDestinatarioCnpj(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Inscrição Estadual</Label>
                <Input
                  value={destinatarioIe}
                  onChange={(e) => setDestinatarioIe(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Endereço</Label>
                <Input
                  value={destinatarioEndereco}
                  onChange={(e) => setDestinatarioEndereco(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={destinatarioCidade}
                  onChange={(e) => setDestinatarioCidade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>UF</Label>
                <Input
                  value={destinatarioUf}
                  onChange={(e) => setDestinatarioUf(e.target.value)}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone
                </Label>
                <Input
                  value={destinatarioTelefone}
                  onChange={(e) => setDestinatarioTelefone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  value={destinatarioEmail}
                  onChange={(e) => setDestinatarioEmail(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações da Nota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configurações de Emissão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Natureza da Operação</Label>
              <Select value={naturezaOperacao} onValueChange={setNaturezaOperacao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venda de Mercadoria">Venda de Mercadoria</SelectItem>
                  <SelectItem value="Prestação de Serviço">Prestação de Serviço</SelectItem>
                  <SelectItem value="Devolução">Devolução</SelectItem>
                  <SelectItem value="Remessa">Remessa</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Bonificação">Bonificação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Série da Nota</Label>
              <Input
                value={serieNota}
                onChange={(e) => setSerieNota(e.target.value)}
                placeholder="001"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label>CFOP Padrão</Label>
              <Select value={cfopPadrao} onValueChange={setCfopPadrao}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5102">5102 - Venda de mercadoria</SelectItem>
                  <SelectItem value="5405">5405 - Venda de mercadoria com ST</SelectItem>
                  <SelectItem value="5933">5933 - Prestação de serviço</SelectItem>
                  <SelectItem value="6102">6102 - Venda interestadual</SelectItem>
                  <SelectItem value="6108">6108 - Venda interestadual não contribuinte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos / Serviços
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
                    {produtos?.filter((p) => p.ativo).map((produto) => (
                      <CommandItem
                        key={produto.id}
                        onSelect={() => handleAddProduct(produto)}
                        className="cursor-pointer"
                      >
                        <div className="flex w-full items-center justify-between">
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              SKU: {produto.sku}
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
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhum produto adicionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>NCM</TableHead>
                    <TableHead>CFOP</TableHead>
                    <TableHead>CST</TableHead>
                    <TableHead className="text-center">Qtd</TableHead>
                    <TableHead className="text-right">Valor Unit.</TableHead>
                    <TableHead className="text-right">ICMS %</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">{item.codigo}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{item.descricao}</TableCell>
                      <TableCell>
                        <Input
                          value={item.ncm}
                          onChange={(e) => setItems(prev => prev.map((it, i) => i === index ? { ...it, ncm: e.target.value } : it))}
                          className="h-8 w-24 font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.cfop}
                          onChange={(e) => setItems(prev => prev.map((it, i) => i === index ? { ...it, cfop: e.target.value } : it))}
                          className="h-8 w-16 font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.cst_csosn}
                          onChange={(e) => setItems(prev => prev.map((it, i) => i === index ? { ...it, cst_csosn: e.target.value } : it))}
                          className="h-8 w-16 font-mono text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantidade}
                          onChange={(e) => updateItem(index, "quantidade", Number(e.target.value))}
                          className="h-8 w-16 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.valor_unitario)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={item.aliquota_icms}
                          onChange={(e) => updateItem(index, "aliquota_icms", Number(e.target.value))}
                          className="h-8 w-16 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.valor_total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeItem(index)}
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
        </CardContent>
      </Card>

      {/* Valores e Totais */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Valores Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Frete</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={valorFrete}
                  onChange={(e) => setValorFrete(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Seguro</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={valorSeguro}
                  onChange={(e) => setValorSeguro(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Outras Despesas</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={valorOutrasDespesas}
                  onChange={(e) => setValorOutrasDespesas(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Totais da Nota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor dos Produtos:</span>
                <span>{formatCurrency(valorProdutos)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Frete:</span>
                <span>{formatCurrency(valorFrete)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Seguro:</span>
                <span>{formatCurrency(valorSeguro)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Outras Despesas:</span>
                <span>{formatCurrency(valorOutrasDespesas)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto:</span>
                <span className="text-destructive">-{formatCurrency(valorDesconto)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base Cálculo ICMS:</span>
                <span>{formatCurrency(valorProdutos)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valor ICMS:</span>
                <span>{formatCurrency(totalIcms)}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span>VALOR TOTAL:</span>
                <span className="text-primary">{formatCurrency(valorTotal)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Informações Complementares</Label>
            <Textarea
              value={informacoesAdicionais}
              onChange={(e) => setInformacoesAdicionais(e.target.value)}
              placeholder="Informações adicionais de interesse do contribuinte..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Informações de Interesse do Fisco</Label>
            <Textarea
              value={observacoesFisco}
              onChange={(e) => setObservacoesFisco(e.target.value)}
              placeholder="Informações adicionais de interesse do fisco..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={onBack}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
          <Save className="h-4 w-4" />
          {isPending ? "Salvando..." : isEditing ? "Atualizar Nota" : "Salvar Nota Fiscal"}
        </Button>
      </div>
    </div>
  );
}
