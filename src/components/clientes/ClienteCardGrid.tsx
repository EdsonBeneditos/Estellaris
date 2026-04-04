import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Phone, Mail, MapPin, FileText, Paperclip, RefreshCw, History, Plus, Pencil, Trash2, CalendarDays, X as XIcon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ClienteComContratos, Contrato, calcularFidelidade, diasAteVencimento, useDeleteCliente, useUploadContratoPdf, useRemoveContratoPdf } from "@/hooks/useClientes";
import { ContratoModal } from "./ContratoModal";
import { RenovarContratoModal } from "./RenovarContratoModal";
import { ClienteTimeline } from "./ClienteTimeline";
import { AgendarVisitaModal } from "./AgendarVisitaModal";
import { getVisitaBadgeConfig } from "@/hooks/useVisitasAlerts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PENDENTE_CADASTRO_MARKER } from "@/hooks/usePendingClientesCount";
import React, { useRef } from "react";

interface ClienteCardGridProps {
  clientes: ClienteComContratos[];
  onEdit: (cliente: ClienteComContratos) => void;
}

function temRenovacaoProxima(contratos: Contrato[]) {
  return contratos.some((c) => {
    if (c.status !== "Ativo") return false;
    const dias = diasAteVencimento(c.data_fim);
    return dias !== null && dias <= 60;
  });
}

export function ClienteCardGrid({ clientes, onEdit }: ClienteCardGridProps) {
  const deleteCliente = useDeleteCliente();
  const uploadContrato = useUploadContratoPdf();
  const removeContrato = useRemoveContratoPdf();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [selectedCliente, setSelectedCliente] = useState<ClienteComContratos | null>(null);
  const [contratoModal, setContratoModal] = useState<{ open: boolean; clienteId: string; contrato: Contrato | null }>({ open: false, clienteId: "", contrato: null });
  const [renovarModal, setRenovarModal] = useState<{ open: boolean; contrato: Contrato | null }>({ open: false, contrato: null });
  const [agendarVisitaOpen, setAgendarVisitaOpen] = useState(false);

  const handleContratoFileChange = (clienteId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos.");
      return;
    }
    uploadContrato.mutate({ clienteId, file });
    e.target.value = "";
  };

  if (clientes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum cliente cadastrado</p>
      </div>
    );
  }

  return (
    <>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
      >
        {clientes.map((cliente) => {
          const temContrato = cliente.contratos.some((c) => c.status === "Ativo");
          const renovacao = temRenovacaoProxima(cliente.contratos);
          const pendente = cliente.observacoes?.startsWith(PENDENTE_CADASTRO_MARKER);
          const visitaConfig = cliente.rotina_visitas && cliente.proxima_visita
            ? getVisitaBadgeConfig(cliente.proxima_visita)
            : null;

          return (
            <button
              key={cliente.id}
              onClick={() => setSelectedCliente(cliente)}
              className="group relative flex flex-col items-center justify-between rounded-xl border border-zinc-700/60 bg-zinc-900 p-3 text-center transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:bg-zinc-800"
              style={{ minHeight: "100px" }}
            >
              {/* Name centered */}
              <div className="w-full flex-1 flex items-center justify-center mb-2">
                <p className="text-sm font-semibold text-zinc-100 leading-tight line-clamp-3 break-words">
                  {cliente.nome}
                </p>
              </div>

              {/* Badges row */}
              <div className="flex flex-wrap justify-center gap-1 mt-auto">
                {temContrato && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    Ativo
                  </span>
                )}
                {renovacao && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-400 animate-pulse">
                    Renovação
                  </span>
                )}
                {pendente && (
                  <span className="inline-flex items-center rounded-full bg-blue-500/10 border border-blue-500/30 px-1.5 py-0.5 text-[10px] font-medium text-blue-400 animate-pulse">
                    Pendente
                  </span>
                )}
                {cliente.contrato_pdf_url && (
                  <span className="inline-flex items-center rounded-full bg-zinc-700 border border-zinc-600 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
                    <Paperclip className="h-2.5 w-2.5 mr-0.5" />
                    PDF
                  </span>
                )}
              </div>

              {/* Contract count */}
              {cliente.contratos.length > 0 && (
                <span className="absolute top-2 right-2 text-[10px] text-zinc-500 font-medium">
                  {cliente.contratos.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Detail Dialog */}
      {selectedCliente && (
        <Dialog open={!!selectedCliente} onOpenChange={(o) => { if (!o) setSelectedCliente(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
            <DialogHeader className="flex flex-row items-start justify-between gap-3 pb-3 border-b">
              <div className="min-w-0 space-y-1.5">
                <DialogTitle className="text-lg font-semibold leading-tight">
                  {selectedCliente.nome}
                </DialogTitle>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCliente.observacoes?.startsWith(PENDENTE_CADASTRO_MARKER) && (
                    <Badge className="bg-emerald-600 text-white text-xs border-0 animate-pulse">Cadastro Pendente</Badge>
                  )}
                  {temRenovacaoProxima(selectedCliente.contratos) && (
                    <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs animate-pulse">Renovação Próxima</Badge>
                  )}
                  {selectedCliente.tags?.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                  {selectedCliente.status_financeiro && selectedCliente.status_financeiro !== "Em dia" && (
                    <Badge className={`text-xs ${selectedCliente.status_financeiro === "Inadimplente" ? "bg-destructive/10 text-destructive border border-destructive/30 animate-pulse" : "bg-amber-500/10 text-amber-600 border border-amber-500/30"}`}>
                      {selectedCliente.status_financeiro}
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelectedCliente(null)}>
                <XIcon className="h-4 w-4" />
              </Button>
            </DialogHeader>

            <div className="space-y-6 pt-2">

              {/* Contato */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  {selectedCliente.nome_contato && (
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Responsável</p>
                      <p className="font-medium text-foreground">{selectedCliente.nome_contato}</p>
                    </div>
                  )}
                  {selectedCliente.telefone && (
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Telefone</p>
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><p className="font-medium">{selectedCliente.telefone}</p></div>
                    </div>
                  )}
                  {selectedCliente.whatsapp && (
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">WhatsApp</p>
                      <p className="font-medium text-foreground">{selectedCliente.whatsapp}</p>
                    </div>
                  )}
                  {selectedCliente.email && (
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">E-mail</p>
                      <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><p className="font-medium truncate">{selectedCliente.email}</p></div>
                    </div>
                  )}
                  {selectedCliente.cnpj && (
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">CNPJ</p>
                      <p className="font-medium text-foreground">{selectedCliente.cnpj}</p>
                    </div>
                  )}
                  {selectedCliente.site && (
                    <div className="space-y-0.5">
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Site</p>
                      <p className="font-medium text-foreground truncate">{selectedCliente.site}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dados Comerciais */}
              {(selectedCliente.segmento || selectedCliente.porte_empresa || selectedCliente.responsavel_comercial || selectedCliente.origem_lead) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comercial</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {selectedCliente.segmento && <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Segmento</p><p className="font-medium">{selectedCliente.segmento}</p></div>}
                    {selectedCliente.porte_empresa && <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Porte</p><p className="font-medium">{selectedCliente.porte_empresa}</p></div>}
                    {selectedCliente.responsavel_comercial && <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Responsável</p><p className="font-medium">{selectedCliente.responsavel_comercial}</p></div>}
                    {selectedCliente.origem_lead && <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Origem</p><p className="font-medium">{selectedCliente.origem_lead}</p></div>}
                  </div>
                </div>
              )}

              {/* Localização */}
              {(selectedCliente.cidade || selectedCliente.logradouro) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Endereço</h4>
                  <div className="flex items-start gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-foreground">
                      {[selectedCliente.logradouro, selectedCliente.numero, selectedCliente.complemento, selectedCliente.bairro, selectedCliente.cidade && `${selectedCliente.cidade}${selectedCliente.uf ? ` - ${selectedCliente.uf}` : ""}`].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Financeiro */}
              {(selectedCliente.limite_credito || selectedCliente.forma_pagamento || selectedCliente.score_satisfacao) && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financeiro</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                    {selectedCliente.limite_credito && <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Limite de Crédito</p><p className="font-medium">R$ {Number(selectedCliente.limite_credito).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>}
                    {selectedCliente.forma_pagamento && <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Forma de Pagamento</p><p className="font-medium">{selectedCliente.forma_pagamento}</p></div>}
                    {selectedCliente.score_satisfacao && <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Score</p><p className="font-medium">{"★".repeat(selectedCliente.score_satisfacao)}{"☆".repeat(5 - selectedCliente.score_satisfacao)}</p></div>}
                  </div>
                </div>
              )}

              {/* Visitas */}
              {selectedCliente.rotina_visitas && (
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rotina de Visitas</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Frequência</p><p className="font-medium">{selectedCliente.frequencia_visita || "-"}</p></div>
                    <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Última Visita</p><p className="font-medium">{selectedCliente.ultima_visita ? format(new Date(selectedCliente.ultima_visita), "dd/MM/yyyy", { locale: ptBR }) : "-"}</p></div>
                    <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Próxima Visita</p><p className="font-medium">{selectedCliente.proxima_visita ? format(new Date(selectedCliente.proxima_visita), "dd/MM/yyyy", { locale: ptBR }) : "-"}</p></div>
                  </div>
                </div>
              )}

              {/* Observações Internas */}
              {selectedCliente.observacoes_internas && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Obs. Internas</h4>
                  <p className="text-sm text-foreground bg-muted/40 rounded-lg p-3 border border-border/50">{selectedCliente.observacoes_internas}</p>
                </div>
              )}

              {/* Tabs */}
              <Tabs defaultValue="contratos">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="contratos"><FileText className="h-4 w-4 mr-2" />Contratos</TabsTrigger>
                  <TabsTrigger value="historico"><History className="h-4 w-4 mr-2" />Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="contratos" className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Contratos ({selectedCliente.contratos.length})</span>
                    <Button size="sm" variant="outline" onClick={() => setContratoModal({ open: true, clienteId: selectedCliente.id, contrato: null })}>
                      <Plus className="h-4 w-4 mr-1" />Novo
                    </Button>
                  </div>
                  {selectedCliente.contratos.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum contrato cadastrado</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedCliente.contratos.map((contrato) => (
                        <div key={contrato.id} className="p-4 bg-card rounded-lg border border-border/50 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex gap-1.5 flex-wrap">
                              <Badge variant={contrato.status === "Ativo" ? "default" : contrato.status === "Cancelado" ? "destructive" : "secondary"} className="text-xs">{contrato.status}</Badge>
                              {contrato.recorrente && <Badge variant="outline" className="text-xs">Recorrente</Badge>}
                            </div>
                            {contrato.status === "Ativo" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setContratoModal({ open: true, clienteId: selectedCliente.id, contrato })}><Pencil className="h-3.5 w-3.5" /></Button>
                                <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1" onClick={() => setRenovarModal({ open: true, contrato })}><RefreshCw className="h-3 w-3" />Renovar</Button>
                              </div>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Serviço</p><p className="font-medium">{contrato.servico_prestado}</p></div>
                            <div className="space-y-0.5"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Valor</p><p className="font-medium">R$ {contrato.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div>
                            <div className="space-y-0.5 col-span-2"><p className="text-[11px] text-muted-foreground uppercase tracking-wide">Período</p><p className="font-medium">{format(new Date(contrato.data_inicio), "dd/MM/yyyy")} {contrato.data_fim && `→ ${format(new Date(contrato.data_fim), "dd/MM/yyyy")}`}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="historico" className="mt-4">
                  <ClienteTimeline clienteId={selectedCliente.id} createdAt={selectedCliente.created_at} />
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-2 pt-4 border-t border-border/50">
                <input type="file" accept="application/pdf" className="hidden"
                  ref={(el) => { fileInputRefs.current[selectedCliente.id] = el; }}
                  onChange={(e) => handleContratoFileChange(selectedCliente.id, e)}
                />
                {selectedCliente.contrato_pdf_url ? (
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="outline" className="gap-1.5 text-primary border-primary/40 hover:bg-primary/5"
                      onClick={() => window.open(selectedCliente.contrato_pdf_url!, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />Ver contrato
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5" disabled={uploadContrato.isPending}
                      onClick={() => fileInputRefs.current[selectedCliente.id]?.click()}>
                      <Paperclip className="h-3.5 w-3.5" />Substituir
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 px-2"
                      disabled={removeContrato.isPending} onClick={() => removeContrato.mutate(selectedCliente.id)}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="gap-1.5" disabled={uploadContrato.isPending}
                    onClick={() => fileInputRefs.current[selectedCliente.id]?.click()}>
                    <Paperclip className="h-3.5 w-3.5" />
                    {uploadContrato.isPending ? "Enviando..." : "Anexar contrato"}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAgendarVisitaOpen(true)}>
                  <CalendarDays className="h-3.5 w-3.5" />Agendar Visita
                </Button>
                <Button size="sm" variant="outline" onClick={() => { onEdit(selectedCliente); setSelectedCliente(null); }}>
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive"><Trash2 className="h-3.5 w-3.5 mr-1.5" />Excluir</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                      <AlertDialogDescription>Tem certeza que deseja excluir "{selectedCliente.nome}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCliente.mutate(selectedCliente.id, {
                        onSuccess: () => { toast.success("Cliente excluído"); setSelectedCliente(null); },
                        onError: (e: any) => toast.error(e.message || "Erro ao excluir"),
                      })} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <ContratoModal
        open={contratoModal.open}
        onOpenChange={(open) => setContratoModal({ ...contratoModal, open })}
        clienteId={contratoModal.clienteId}
        contrato={contratoModal.contrato}
      />
      <RenovarContratoModal
        open={renovarModal.open}
        onOpenChange={(open) => setRenovarModal({ ...renovarModal, open })}
        contrato={renovarModal.contrato}
      />
      {selectedCliente && (
        <AgendarVisitaModal
          open={agendarVisitaOpen}
          onOpenChange={setAgendarVisitaOpen}
          clienteId={selectedCliente.id}
          clienteNome={selectedCliente.nome}
          proximaVisitaAtual={selectedCliente.proxima_visita ?? null}
          rotinaVisitas={selectedCliente.rotina_visitas ?? false}
          frequenciaAtual={selectedCliente.frequencia_visita ?? null}
        />
      )}
    </>
  );
}
