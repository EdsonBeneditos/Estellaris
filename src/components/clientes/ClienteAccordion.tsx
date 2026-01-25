import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Phone, Mail, MapPin, RefreshCw, FileText, Plus, Pencil, Trash2, History } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClienteComContratos, Contrato, calcularFidelidade, diasAteVencimento, useDeleteCliente } from "@/hooks/useClientes";
import { ContratoModal } from "./ContratoModal";
import { RenovarContratoModal } from "./RenovarContratoModal";
import { ClienteTimeline } from "./ClienteTimeline";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ClienteAccordionProps {
  clientes: ClienteComContratos[];
  onEdit: (cliente: ClienteComContratos) => void;
}

function ContratoStatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Ativo: "default",
    Finalizado: "secondary",
    Cancelado: "destructive",
    Renovado: "outline",
  };

  return (
    <Badge variant={variants[status] || "outline"} className="text-xs">
      {status}
    </Badge>
  );
}

function RenovacaoBadge({ dataFim }: { dataFim: string | null }) {
  const dias = diasAteVencimento(dataFim);
  
  if (dias === null || dias > 60) return null;
  
  if (dias <= 0) {
    return (
      <Badge variant="destructive" className="text-xs animate-pulse">
        Vencido
      </Badge>
    );
  }
  
  return (
    <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-200">
      Renovação Próxima ({dias} dias)
    </Badge>
  );
}

function ContratoCard({
  contrato,
  onRenovar,
  onEdit,
}: {
  contrato: Contrato;
  onRenovar: (contrato: Contrato) => void;
  onEdit: (contrato: Contrato) => void;
}) {
  return (
    <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <ContratoStatusBadge status={contrato.status} />
          {contrato.status === "Ativo" && <RenovacaoBadge dataFim={contrato.data_fim} />}
          {contrato.recorrente && (
            <Badge variant="outline" className="text-xs">Recorrente</Badge>
          )}
        </div>
        
        {contrato.status === "Ativo" && (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => onEdit(contrato)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onRenovar(contrato)}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Renovar
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Tipo de Vínculo</p>
          <p className="font-medium text-zinc-950">{contrato.tipo_vinculo}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Serviço</p>
          <p className="font-medium text-zinc-950">{contrato.servico_prestado}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Valor</p>
          <p className="font-medium text-zinc-950">
            R$ {contrato.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Período</p>
          <p className="font-medium text-zinc-950">
            {format(new Date(contrato.data_inicio), "dd/MM/yyyy")}
            {contrato.data_fim && ` - ${format(new Date(contrato.data_fim), "dd/MM/yyyy")}`}
          </p>
        </div>
      </div>
    </div>
  );
}

export function ClienteAccordion({ clientes, onEdit }: ClienteAccordionProps) {
  const deleteCliente = useDeleteCliente();
  const [contratoModal, setContratoModal] = useState<{ open: boolean; clienteId: string; contrato: Contrato | null }>({
    open: false,
    clienteId: "",
    contrato: null,
  });
  const [renovarModal, setRenovarModal] = useState<{ open: boolean; contrato: Contrato | null }>({
    open: false,
    contrato: null,
  });

  const handleNovoContrato = (clienteId: string) => {
    setContratoModal({ open: true, clienteId, contrato: null });
  };

  const handleEditContrato = (clienteId: string, contrato: Contrato) => {
    setContratoModal({ open: true, clienteId, contrato });
  };

  const handleRenovar = (contrato: Contrato) => {
    setRenovarModal({ open: true, contrato });
  };

  // Verificar se cliente tem contrato próximo de vencer
  const temRenovacaoProxima = (contratos: Contrato[]) => {
    return contratos.some(c => {
      if (c.status !== "Ativo") return false;
      const dias = diasAteVencimento(c.data_fim);
      return dias !== null && dias <= 60;
    });
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
      <Accordion type="single" collapsible className="space-y-2">
        {clientes.map((cliente) => {
          const contratoAtivo = cliente.contratos.find(c => c.status === "Ativo");
          const fidelidade = calcularFidelidade(cliente.contratos);

          return (
            <AccordionItem
              key={cliente.id}
              value={cliente.id}
              className="border rounded-lg overflow-hidden bg-white"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 data-[state=open]:bg-slate-50">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-zinc-950">{cliente.nome}</span>
                    {temRenovacaoProxima(cliente.contratos) && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 text-xs">
                        Renovação Próxima
                      </Badge>
                    )}
                    {cliente.rotina_visitas && (
                      <Badge variant="outline" className="text-xs">Visitas</Badge>
                    )}
                  </div>
                  {fidelidade > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {fidelidade} {fidelidade === 1 ? "mês" : "meses"} de fidelidade
                    </span>
                  )}
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-0 pb-0">
                <div className="bg-slate-50 p-4 space-y-6">
                  {/* Dados do Cliente */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cliente.telefone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-zinc-950">{cliente.telefone}</span>
                      </div>
                    )}
                    {cliente.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-zinc-950">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.cidade && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-zinc-950">{cliente.cidade}{cliente.uf && ` - ${cliente.uf}`}</span>
                      </div>
                    )}
                    {cliente.cnpj && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">CNPJ: </span>
                        <span className="text-zinc-950">{cliente.cnpj}</span>
                      </div>
                    )}
                  </div>

                  {/* Rotina de Visitas */}
                  {cliente.rotina_visitas && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <h4 className="text-sm font-medium text-zinc-950 mb-2">Rotina de Visitas</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Frequência</p>
                          <p className="font-medium text-zinc-950">{cliente.frequencia_visita || "-"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Última Visita</p>
                          <p className="font-medium text-zinc-950">
                            {cliente.ultima_visita
                              ? format(new Date(cliente.ultima_visita), "dd/MM/yyyy", { locale: ptBR })
                              : "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Próxima Visita</p>
                          <p className="font-medium text-zinc-950">
                            {cliente.proxima_visita
                              ? format(new Date(cliente.proxima_visita), "dd/MM/yyyy", { locale: ptBR })
                              : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tabs: Contratos e Timeline */}
                  <Tabs defaultValue="contratos" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-200">
                      <TabsTrigger value="contratos" className="data-[state=active]:bg-white">
                        <FileText className="h-4 w-4 mr-2" />
                        Contratos
                      </TabsTrigger>
                      <TabsTrigger value="historico" className="data-[state=active]:bg-white">
                        <History className="h-4 w-4 mr-2" />
                        Histórico
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="contratos" className="mt-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-zinc-950">Contratos</h4>
                          <Button size="sm" variant="outline" onClick={() => handleNovoContrato(cliente.id)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Novo Contrato
                          </Button>
                        </div>
                        
                        {cliente.contratos.length > 0 ? (
                          <div className="space-y-2">
                            {cliente.contratos.map((contrato) => (
                              <ContratoCard
                                key={contrato.id}
                                contrato={contrato}
                                onRenovar={handleRenovar}
                                onEdit={(c) => handleEditContrato(cliente.id, c)}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum contrato cadastrado
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="historico" className="mt-4">
                      <ClienteTimeline clienteId={cliente.id} />
                    </TabsContent>
                  </Tabs>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                    <Button size="sm" variant="outline" onClick={() => onEdit(cliente)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Editar Cliente
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o cliente "{cliente.nome}"? Esta ação não pode ser desfeita e todos os contratos associados serão removidos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteCliente.mutate(cliente.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

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
    </>
  );
}
