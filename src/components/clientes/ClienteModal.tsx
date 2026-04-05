import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Cliente, useCreateCliente, useUpdateCliente } from "@/hooks/useClientes";
import { applyCNPJMask, applyPhoneMask, applyCEPMask } from "@/lib/masks";
import { PENDENTE_CADASTRO_MARKER } from "@/hooks/usePendingClientesCount";
import { VisitaConfirmDialog } from "./VisitaConfirmDialog";
import { useCreateAtividade } from "@/hooks/useAtividadesCliente";
import { useViaCep } from "@/hooks/useViaCep";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X } from "lucide-react";

interface ClienteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
}

const FREQUENCIAS_VISITA = [
  { value: "Semanal", label: "Semanal" },
  { value: "Quinzenal", label: "Quinzenal" },
  { value: "Mensal", label: "Mensal" },
  { value: "Bimestral", label: "Bimestral" },
  { value: "Trimestral", label: "Trimestral" },
];

const UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO"
];

const PORTES = ["MEI", "Microempresa", "Pequeno", "Médio", "Grande"];
const FORMAS_PAGAMENTO = ["Boleto", "PIX", "Cartão de crédito", "Cartão de débito", "Dinheiro", "Transferência"];
const STATUS_FINANCEIRO = ["Em dia", "Inadimplente", "Em negociação"];
const TAGS_OPTIONS = ["VIP", "Em risco", "Novo", "Inativo", "Fidelizado", "Atenção"];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-2 mb-4">
      {children}
    </h3>
  );
}

const emptyForm = {
  nome: "",
  cnpj: "",
  email: "",
  telefone: "",
  endereco: "",
  cidade: "",
  uf: "",
  cep: "",
  rotina_visitas: false,
  frequencia_visita: "",
  ultima_visita: "",
  proxima_visita: "",
  observacoes: "",
  // Contato
  nome_contato: "",
  whatsapp: "",
  site: "",
  // Comercial
  segmento: "",
  porte_empresa: "",
  responsavel_comercial: "",
  origem_lead: "",
  // Financeiro
  limite_credito: "",
  forma_pagamento: "",
  status_financeiro: "Em dia",
  // Endereço completo
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  // CRM
  tags: [] as string[],
  score_satisfacao: "",
  observacoes_internas: "",
};

export function ClienteModal({ open, onOpenChange, cliente }: ClienteModalProps) {
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const createAtividade = useCreateAtividade();
  const { fetchAddress, isLoading: isLoadingCep } = useViaCep();

  const handleCepBlur = async () => {
    const result = await fetchAddress(formData.cep);
    if (result) {
      setFormData(prev => ({
        ...prev,
        logradouro: result.logradouro || prev.logradouro,
        bairro: result.bairro || prev.bairro,
        cidade: result.localidade || prev.cidade,
        uf: result.uf || prev.uf,
      }));
    }
  };

  const [formData, setFormData] = useState({ ...emptyForm });
  const [visitaConfirmDialog, setVisitaConfirmDialog] = useState<{
    open: boolean; dataAnterior: string; pendingData: any;
  }>({ open: false, dataAnterior: "", pendingData: null });

  useEffect(() => {
    if (cliente) {
      const rawObs = cliente.observacoes || "";
      const displayObs = rawObs.startsWith(PENDENTE_CADASTRO_MARKER)
        ? rawObs.slice(PENDENTE_CADASTRO_MARKER.length).trim()
        : rawObs;

      setFormData({
        nome: cliente.nome || "",
        cnpj: applyCNPJMask(cliente.cnpj || ""),
        email: cliente.email || "",
        telefone: applyPhoneMask(cliente.telefone || ""),
        endereco: cliente.endereco || "",
        cidade: cliente.cidade || "",
        uf: cliente.uf || "",
        cep: applyCEPMask(cliente.cep || ""),
        rotina_visitas: cliente.rotina_visitas || false,
        frequencia_visita: cliente.frequencia_visita || "",
        ultima_visita: cliente.ultima_visita || "",
        proxima_visita: cliente.proxima_visita || "",
        observacoes: displayObs,
        nome_contato: cliente.nome_contato || "",
        whatsapp: applyPhoneMask(cliente.whatsapp || ""),
        site: cliente.site || "",
        segmento: cliente.segmento || "",
        porte_empresa: cliente.porte_empresa || "",
        responsavel_comercial: cliente.responsavel_comercial || "",
        origem_lead: cliente.origem_lead || "",
        limite_credito: cliente.limite_credito?.toString() || "",
        forma_pagamento: cliente.forma_pagamento || "",
        status_financeiro: cliente.status_financeiro || "Em dia",
        logradouro: cliente.logradouro || "",
        numero: cliente.numero || "",
        complemento: cliente.complemento || "",
        bairro: cliente.bairro || "",
        tags: cliente.tags || [],
        score_satisfacao: cliente.score_satisfacao?.toString() || "",
        observacoes_internas: cliente.observacoes_internas || "",
      });
    } else {
      setFormData({ ...emptyForm });
    }
  }, [cliente, open]);

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  const executeSave = async (data: any, registrarVisitaConcluida: boolean) => {
    if (cliente) {
      await updateCliente.mutateAsync({ id: cliente.id, data });
      if (registrarVisitaConcluida && visitaConfirmDialog.dataAnterior) {
        const dataFormatada = format(new Date(visitaConfirmDialog.dataAnterior), "dd/MM/yyyy", { locale: ptBR });
        await createAtividade.mutateAsync({
          cliente_id: cliente.id,
          tipo: "Sistema",
          descricao: `Visita Técnica Concluída (agendada para ${dataFormatada})`,
        });
      }
    } else {
      await createCliente.mutateAsync(data);
    }
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nome: formData.nome,
      cnpj: formData.cnpj || null,
      email: formData.email || null,
      telefone: formData.telefone || null,
      endereco: formData.endereco || null,
      cidade: formData.cidade || null,
      uf: formData.uf || null,
      cep: formData.cep || null,
      rotina_visitas: formData.rotina_visitas,
      frequencia_visita: formData.rotina_visitas ? formData.frequencia_visita || null : null,
      ultima_visita: formData.rotina_visitas && formData.ultima_visita ? formData.ultima_visita : null,
      proxima_visita: formData.rotina_visitas && formData.proxima_visita ? formData.proxima_visita : null,
      observacoes: formData.observacoes || null,
      nome_contato: formData.nome_contato || null,
      whatsapp: formData.whatsapp || null,
      site: formData.site || null,
      segmento: formData.segmento || null,
      porte_empresa: formData.porte_empresa || null,
      responsavel_comercial: formData.responsavel_comercial || null,
      origem_lead: formData.origem_lead || null,
      limite_credito: formData.limite_credito ? parseFloat(formData.limite_credito) : null,
      forma_pagamento: formData.forma_pagamento || null,
      status_financeiro: formData.status_financeiro || null,
      logradouro: formData.logradouro || null,
      numero: formData.numero || null,
      complemento: formData.complemento || null,
      bairro: formData.bairro || null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      score_satisfacao: formData.score_satisfacao ? parseInt(formData.score_satisfacao) : null,
      observacoes_internas: formData.observacoes_internas || null,
    };

    if (cliente && cliente.proxima_visita && formData.proxima_visita !== cliente.proxima_visita) {
      setVisitaConfirmDialog({ open: true, dataAnterior: cliente.proxima_visita, pendingData: data });
      return;
    }

    await executeSave(data, false);
  };

  const isLoading = createCliente.isPending || updateCliente.isPending || createAtividade.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-semibold">
            {cliente ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 py-2 overflow-y-auto flex-1 pr-1">

          {/* ── Dados Básicos ── */}
          <div>
            <SectionTitle>Dados Básicos</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required placeholder="Nome do cliente" />
              </div>
              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" value={formData.cnpj} onChange={e => setFormData({ ...formData, cnpj: applyCNPJMask(e.target.value) })} placeholder="00.000.000/0000-00" />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@empresa.com" />
              </div>
              <div>
                <Label htmlFor="telefone">Telefone Fixo</Label>
                <Input id="telefone" value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: applyPhoneMask(e.target.value) })} placeholder="(00) 0000-0000" />
              </div>
              <div>
                <Label htmlFor="site">Site / Redes Sociais</Label>
                <Input id="site" value={formData.site} onChange={e => setFormData({ ...formData, site: e.target.value })} placeholder="www.empresa.com.br" />
              </div>
            </div>
          </div>

          {/* ── Contato Principal ── */}
          <div>
            <SectionTitle>Contato Principal</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome_contato">Nome do Responsável</Label>
                <Input id="nome_contato" value={formData.nome_contato} onChange={e => setFormData({ ...formData, nome_contato: e.target.value })} placeholder="Nome da pessoa de contato" />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input id="whatsapp" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: applyPhoneMask(e.target.value) })} placeholder="(00) 00000-0000" />
              </div>
            </div>
          </div>

          {/* ── Dados Comerciais ── */}
          <div>
            <SectionTitle>Dados Comerciais</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="segmento">Segmento / Ramo</Label>
                <Input id="segmento" value={formData.segmento} onChange={e => setFormData({ ...formData, segmento: e.target.value })} placeholder="Ex: Padaria, Mercado, Restaurante" />
              </div>
              <div>
                <Label htmlFor="porte_empresa">Porte da Empresa</Label>
                <Select value={formData.porte_empresa} onValueChange={v => setFormData({ ...formData, porte_empresa: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{PORTES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responsavel_comercial">Responsável Comercial</Label>
                <Input id="responsavel_comercial" value={formData.responsavel_comercial} onChange={e => setFormData({ ...formData, responsavel_comercial: e.target.value })} placeholder="Vendedor / Representante" />
              </div>
              <div>
                <Label htmlFor="origem_lead">Origem do Lead</Label>
                <Input id="origem_lead" value={formData.origem_lead} onChange={e => setFormData({ ...formData, origem_lead: e.target.value })} placeholder="Ex: Indicação, Prospecção, Redes sociais" />
              </div>
            </div>
          </div>

          {/* ── Financeiro ── */}
          <div>
            <SectionTitle>Financeiro</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="limite_credito">Limite de Crédito (R$)</Label>
                <Input id="limite_credito" type="number" step="0.01" min="0" value={formData.limite_credito} onChange={e => setFormData({ ...formData, limite_credito: e.target.value })} placeholder="0,00" />
              </div>
              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select value={formData.forma_pagamento} onValueChange={v => setFormData({ ...formData, forma_pagamento: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status_financeiro">Status Financeiro</Label>
                <Select value={formData.status_financeiro} onValueChange={v => setFormData({ ...formData, status_financeiro: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{STATUS_FINANCEIRO.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Endereço ── */}
          <div>
            <SectionTitle>Endereço</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid grid-cols-3 gap-2 md:col-span-2">
                <div className="col-span-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input id="cep" value={formData.cep} onChange={e => setFormData({ ...formData, cep: applyCEPMask(e.target.value) })} onBlur={handleCepBlur} placeholder="00000-000" />
                  {isLoadingCep && <span className="text-xs text-muted-foreground">Buscando...</span>}
                </div>
                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Select value={formData.uf} onValueChange={v => setFormData({ ...formData, uf: v })}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{UFS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="logradouro">Logradouro (Rua/Av.)</Label>
                <Input id="logradouro" value={formData.logradouro} onChange={e => setFormData({ ...formData, logradouro: e.target.value })} placeholder="Rua / Avenida" />
              </div>
              <div>
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" value={formData.numero} onChange={e => setFormData({ ...formData, numero: e.target.value })} placeholder="Nº" />
              </div>
              <div>
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" value={formData.complemento} onChange={e => setFormData({ ...formData, complemento: e.target.value })} placeholder="Apto, Sala, Bloco..." />
              </div>
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" value={formData.bairro} onChange={e => setFormData({ ...formData, bairro: e.target.value })} placeholder="Bairro" />
              </div>
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input id="cidade" value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} placeholder="Cidade" />
              </div>
            </div>
          </div>

          {/* ── Rotina de Visitas ── */}
          <div>
            <SectionTitle>Rotina de Visitas</SectionTitle>
            <div className="flex items-center space-x-3 mb-4">
              <Switch id="rotina_visitas" checked={formData.rotina_visitas} onCheckedChange={checked => setFormData({ ...formData, rotina_visitas: checked })} />
              <Label htmlFor="rotina_visitas" className="cursor-pointer">Cliente possui rotina de visitas</Label>
            </div>
            {formData.rotina_visitas && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <Label>Frequência</Label>
                  <Select value={formData.frequencia_visita} onValueChange={v => setFormData({ ...formData, frequencia_visita: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>{FREQUENCIAS_VISITA.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ultima_visita">Última Visita</Label>
                  <Input id="ultima_visita" type="date" value={formData.ultima_visita} onChange={e => setFormData({ ...formData, ultima_visita: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="proxima_visita">Próxima Visita</Label>
                  <Input id="proxima_visita" type="date" value={formData.proxima_visita} onChange={e => setFormData({ ...formData, proxima_visita: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          {/* ── CRM / Relacionamento ── */}
          <div>
            <SectionTitle>CRM / Relacionamento</SectionTitle>
            <div className="space-y-4">
              <div>
                <Label>Tags / Categorias</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {TAGS_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        formData.tags.includes(tag)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="score_satisfacao">Score de Satisfação (1-5)</Label>
                <div className="flex gap-2 mt-2">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormData({ ...formData, score_satisfacao: formData.score_satisfacao === n.toString() ? "" : n.toString() })}
                      className={`h-9 w-9 rounded-full border text-sm font-semibold transition-all ${
                        formData.score_satisfacao === n.toString()
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="observacoes_internas">Observações Internas</Label>
                <Textarea id="observacoes_internas" value={formData.observacoes_internas} onChange={e => setFormData({ ...formData, observacoes_internas: e.target.value })} placeholder="Notas internas da equipe sobre este cliente..." rows={3} />
              </div>
            </div>
          </div>

          {/* ── Observações Gerais ── */}
          <div>
            <SectionTitle>Observações Gerais</SectionTitle>
            <Textarea id="observacoes" value={formData.observacoes} onChange={e => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observações gerais sobre o cliente..." rows={3} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>{isLoading ? "Salvando..." : cliente ? "Salvar" : "Cadastrar"}</Button>
          </div>
        </form>
      </DialogContent>

      <VisitaConfirmDialog
        open={visitaConfirmDialog.open}
        onOpenChange={open => setVisitaConfirmDialog(prev => ({ ...prev, open }))}
        dataAnterior={visitaConfirmDialog.dataAnterior}
        onConfirm={async () => { setVisitaConfirmDialog(prev => ({ ...prev, open: false })); await executeSave(visitaConfirmDialog.pendingData, true); }}
        onSkip={async () => { setVisitaConfirmDialog(prev => ({ ...prev, open: false })); await executeSave(visitaConfirmDialog.pendingData, false); }}
      />
    </Dialog>
  );
}
