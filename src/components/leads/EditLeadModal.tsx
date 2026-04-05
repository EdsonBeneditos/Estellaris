import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, History, MessageSquare, ArrowRight, Trash2, PlusCircle, TrendingUp } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { useUpdateLead, useDeleteLead, type Lead } from "@/hooks/useLeads";
import { OportunidadesTab } from "./OportunidadesTab";
import { LEAD_STATUS_TO_OP, type Oportunidade } from "@/hooks/useOportunidades";
import {
  useLeadInteracoes,
  useCreateInteracao,
} from "@/hooks/useLeadInteracoes";
import { useActiveVendedores } from "@/hooks/useSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { useCreateCliente } from "@/hooks/useClientes";
import { PENDENTE_CADASTRO_MARKER } from "@/hooks/usePendingClientesCount";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { STATUS_OPTIONS, PRIORIDADES, MOTIVOS_PERDA, MEIOS_CONTATO } from "@/lib/constants";

// Schema with conditional validation for motivo_perda
const formSchema = z.object({
  status: z.string().optional(),
  prioridade: z.string().optional(),
  vendedor: z.string().optional(),
  meio_contato: z.string().optional(),
  data_retorno: z.date().optional().nullable(),
  proximo_passo: z.string().optional(),
  motivo_perda: z.string().optional(),
  motivo_perda_detalhe: z.string().optional(),
}).refine((data) => {
  // If status is "Perdido", motivo_perda is required
  if (data.status === "Perdido") {
    return data.motivo_perda && data.motivo_perda.trim().length > 0;
  }
  return true;
}, {
  message: "Selecione o motivo da perda",
  path: ["motivo_perda"],
}).refine((data) => {
  // If motivo_perda is "Outros", motivo_perda_detalhe is required
  if (data.status === "Perdido" && data.motivo_perda === "Outros") {
    return data.motivo_perda_detalhe && data.motivo_perda_detalhe.trim().length > 0;
  }
  return true;
}, {
  message: "Descreva o motivo da perda",
  path: ["motivo_perda_detalhe"],
});

type FormData = z.infer<typeof formSchema>;

interface EditLeadModalProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLeadModal({ lead, open, onOpenChange }: EditLeadModalProps) {
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const createInteracao = useCreateInteracao();
  const createCliente = useCreateCliente();
  const { data: vendedores = [] } = useActiveVendedores();
  const { data: interacoes = [], isLoading: interacoesLoading } =
    useLeadInteracoes(lead?.id || "");
  const { canDeleteLeads } = usePermissions();
  const { data: profile } = useCurrentProfile();
  const queryClient = useQueryClient();

  const [observacao, setObservacao] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const watchedStatus = form.watch("status");
  const watchedMotivoPerda = form.watch("motivo_perda");

  useEffect(() => {
    if (lead) {
      form.reset({
        status: lead.status || "Novo",
        prioridade: lead.prioridade || "",
        vendedor: lead.vendedor || "",
        meio_contato: lead.meio_contato || "",
        data_retorno: lead.data_retorno ? new Date(lead.data_retorno) : null,
        proximo_passo: lead.proximo_passo || "",
        motivo_perda: lead.motivo_perda || "",
        motivo_perda_detalhe: lead.motivo_perda_detalhe || "",
      });
    }
  }, [lead, form]);

  const onSubmit = async (data: FormData) => {
    if (!lead) return;

    try {
      const previousStatus = lead.status;
      const newStatus = data.status;
      const db = supabase as any;

      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          ...data,
          data_retorno: data.data_retorno?.toISOString() || null,
          motivo_perda: data.status === "Perdido" ? data.motivo_perda : null,
          motivo_perda_detalhe: data.status === "Perdido" && data.motivo_perda === "Outros"
            ? data.motivo_perda_detalhe
            : null,
        },
      });

      // Create interaction record if status changed
      if (previousStatus !== newStatus) {
        let descricao = `Status alterado de "${previousStatus || "Novo"}" para "${newStatus}"`;
        if (newStatus === "Perdido" && data.motivo_perda) {
          descricao += `. Motivo: ${data.motivo_perda}`;
          if (data.motivo_perda === "Outros" && data.motivo_perda_detalhe) {
            descricao += ` - ${data.motivo_perda_detalhe}`;
          }
        }
        await createInteracao.mutateAsync({
          lead_id: lead.id,
          tipo: "status_change",
          descricao,
          status_anterior: previousStatus || "Novo",
          status_novo: newStatus,
        });
      }

      // ── Sync oportunidades status ──────────────────────────────────────
      if (previousStatus !== newStatus) {
        // Fetch all oportunidades for this lead
        const { data: ops } = await db
          .from("oportunidades")
          .select("id, status, titulo, valor_estimado, itens, vendedor")
          .eq("lead_id", lead.id);

        const oportunidades: Oportunidade[] = ops ?? [];
        const today = new Date().toISOString().split("T")[0];
        const orgId = profile?.organization_id;

        if (newStatus === "Convertido") {
          // Mark all non-Perdida oportunidades as Ganha + create orcamentos
          const toGanha = oportunidades.filter((o) => o.status !== "Perdida");
          for (const op of toGanha) {
            await db
              .from("oportunidades")
              .update({ status: "Ganha", data_fechamento: today })
              .eq("id", op.id);

            // Generate an orcamento for each oportunidade ganha
            const enderecoParts = [lead.logradouro, lead.numero, lead.bairro].filter(Boolean);
            const clienteEndereco = enderecoParts.length > 0 ? enderecoParts.join(", ") : null;

            const { data: newOrc } = await db
              .from("orcamentos")
              .insert({
                lead_id: lead.id,
                oportunidade_id: op.id,
                organization_id: orgId,
                cliente_nome: lead.empresa || "Sem nome",
                cliente_cnpj: lead.cnpj || null,
                cliente_telefone: lead.telefone || null,
                cliente_email: lead.email || null,
                cliente_endereco: clienteEndereco,
                status: "Pendente",
                status_financeiro: "pendente",
                subtotal: op.valor_estimado || 0,
                desconto_total: 0,
                valor_total: op.valor_estimado || 0,
                observacoes: `Gerado automaticamente a partir da oportunidade: ${op.titulo}`,
              })
              .select("id")
              .single();

            // Copy oportunidade items → orcamento_itens
            if (newOrc?.id && Array.isArray(op.itens) && op.itens.length > 0) {
              const orcItens = op.itens.map((item: any) => ({
                orcamento_id: newOrc.id,
                produto_id: item.produto_id,
                produto_nome: item.produto_nome,
                produto_sku: item.produto_sku,
                unidade_medida: item.unidade_medida || "UN",
                quantidade: item.quantidade,
                preco_unitario: item.preco_unitario,
                desconto_percentual: 0,
                desconto_valor: 0,
                valor_total: item.subtotal,
                organization_id: orgId,
              }));
              await db.from("orcamento_itens").insert(orcItens);
            }
          }

          queryClient.invalidateQueries({ queryKey: ["orcamentos"] });
          queryClient.invalidateQueries({ queryKey: ["oportunidades", lead.id] });
          queryClient.invalidateQueries({ queryKey: ["all-oportunidades"] });

          // Auto-create client (existing logic)
          const enderecoParts = [lead.logradouro, lead.numero, lead.bairro].filter(Boolean);
          await createCliente.mutateAsync({
            nome: lead.empresa || "Sem nome",
            cnpj: lead.cnpj || null,
            telefone: lead.telefone || null,
            email: lead.email || null,
            cidade: lead.cidade || null,
            uf: lead.uf || null,
            cep: lead.cep || null,
            endereco: enderecoParts.length > 0 ? enderecoParts.join(", ") : null,
            observacoes: PENDENTE_CADASTRO_MARKER,
            ativo: true,
            rotina_visitas: false,
          });
          if (toGanha.length > 0) {
            toast.success(`${toGanha.length} oportunidade(s) ganha(s) — orçamento(s) gerado(s)!`);
          }
          toast.success("Cliente pré-cadastrado na aba Clientes!");

        } else if (newStatus === "Perdido") {
          // Mark all non-Ganha oportunidades as Perdida
          const motivo = data.motivo_perda || "Não informado";
          const toPerdida = oportunidades.filter((o) => o.status !== "Ganha");
          if (toPerdida.length > 0) {
            const ids = toPerdida.map((o) => o.id);
            await db
              .from("oportunidades")
              .update({ status: "Perdida", motivo_perda: motivo, data_fechamento: today })
              .in("id", ids);
            queryClient.invalidateQueries({ queryKey: ["oportunidades", lead.id] });
            queryClient.invalidateQueries({ queryKey: ["all-oportunidades"] });
          }

        } else {
          // Regular status change — sync oportunidades that are still active
          const mappedOpStatus = LEAD_STATUS_TO_OP[newStatus];
          if (mappedOpStatus) {
            const toSync = oportunidades.filter(
              (o) => o.status !== "Ganha" && o.status !== "Perdida"
            );
            if (toSync.length > 0) {
              const ids = toSync.map((o) => o.id);
              await db
                .from("oportunidades")
                .update({ status: mappedOpStatus })
                .in("id", ids);
              queryClient.invalidateQueries({ queryKey: ["oportunidades", lead.id] });
              queryClient.invalidateQueries({ queryKey: ["all-oportunidades"] });
            }
          }
        }
      }

      toast.success("Lead atualizado com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao atualizar lead");
      console.error(error);
    }
  };

  const handleDeleteLead = async () => {
    if (!lead) return;

    try {
      await deleteLead.mutateAsync(lead.id);
      toast.success("Lead excluído com sucesso!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Erro ao excluir lead");
      console.error(error);
    }
  };

  const handleAddObservacao = async () => {
    if (!lead || !observacao.trim()) return;

    try {
      await createInteracao.mutateAsync({
        lead_id: lead.id,
        tipo: "observacao",
        descricao: observacao,
      });
      setObservacao("");
      toast.success("Observação adicionada!");
    } catch (error) {
      toast.error("Erro ao adicionar observação");
    }
  };

  if (!lead) return null;

  const isConcluded =
    lead.status === "Convertido" || lead.status === "Perdido";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {lead.empresa || "Lead sem nome"}
              </DialogTitle>
              {lead.cnpj && (
                <p className="text-sm text-muted-foreground">{lead.cnpj}</p>
              )}
            </div>
            {canDeleteLeads && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o lead "{lead.empresa || "Lead sem nome"}"? 
                      Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteLead}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="editar" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="editar">Editar</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="oportunidades" className="gap-1.5">
              <TrendingUp className="h-4 w-4" />
              Oportunidades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editar" className="flex-1 overflow-auto mt-4">
            {isConcluded && (
              <div className="mb-4 p-3 rounded-lg bg-muted border border-border">
                <p className="text-sm text-muted-foreground">
                  Este lead foi marcado como <strong>{lead.status}</strong> e
                  não pode mais ser editado.
                </p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Status e Prioridade */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isConcluded}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prioridade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridade</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isConcluded}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORIDADES.map((prioridade) => (
                              <SelectItem key={prioridade} value={prioridade}>
                                {prioridade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Motivo da Perda - Only shown when status is "Perdido" */}
                {watchedStatus === "Perdido" && (
                  <div className="space-y-4 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                    <FormField
                      control={form.control}
                      name="motivo_perda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-destructive font-medium">
                            Motivo da Perda *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isConcluded}
                          >
                            <FormControl>
                              <SelectTrigger className="border-destructive/50">
                                <SelectValue placeholder="Selecione o motivo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {MOTIVOS_PERDA.map((motivo) => (
                                <SelectItem key={motivo} value={motivo}>
                                  {motivo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Detail field when "Outros" is selected */}
                    {watchedMotivoPerda === "Outros" && (
                      <FormField
                        control={form.control}
                        name="motivo_perda_detalhe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-destructive font-medium">
                              Detalhamento *
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descreva o motivo da perda em detalhes..."
                                className="resize-none border-destructive/50 focus-visible:ring-destructive/50"
                                rows={3}
                                disabled={isConcluded}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* Vendedor e Meio de Contato */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vendedor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vendedor</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isConcluded}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {vendedores.map((v) => (
                              <SelectItem key={v.id} value={v.nome}>
                                {v.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="meio_contato"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meio de Contato</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={isConcluded}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MEIOS_CONTATO.map((meio) => (
                              <SelectItem key={meio} value={meio}>
                                {meio}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Data de Retorno */}
                <FormField
                  control={form.control}
                  name="data_retorno"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data de Retorno</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              disabled={isConcluded}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Próximo Passo */}
                <FormField
                  control={form.control}
                  name="proximo_passo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Próximo Passo</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a próxima ação..."
                          className="resize-none"
                          rows={3}
                          disabled={isConcluded}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Adicionar Observação */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Adicionar Observação
                  </label>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite uma observação..."
                      className="resize-none flex-1"
                      rows={2}
                      value={observacao}
                      onChange={(e) => setObservacao(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddObservacao}
                      disabled={!observacao.trim()}
                      className="shrink-0"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isConcluded}>
                    Salvar Alterações
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="historico" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-full pr-4">
              {interacoesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : (
                (() => {
                  const hasCriacaoRecord = interacoes.some(i => i.tipo === "criacao");
                  const displayList = hasCriacaoRecord
                    ? interacoes
                    : [
                        ...interacoes,
                        {
                          id: "__criacao__",
                          lead_id: lead.id,
                          organization_id: null,
                          tipo: "criacao",
                          descricao: "Lead criado",
                          status_anterior: null,
                          status_novo: null,
                          created_at: lead.created_at,
                        },
                      ];

                  return (
                    <div className="space-y-4">
                      {displayList.map((interacao, index) => (
                        <div key={interacao.id}>
                          <div className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center",
                                  interacao.tipo === "criacao"
                                    ? "bg-green-500/10 text-green-600"
                                    : interacao.tipo === "status_change"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {interacao.tipo === "criacao" ? (
                                  <PlusCircle className="h-4 w-4" />
                                ) : interacao.tipo === "status_change" ? (
                                  <ArrowRight className="h-4 w-4" />
                                ) : (
                                  <MessageSquare className="h-4 w-4" />
                                )}
                              </div>
                              {index < displayList.length - 1 && (
                                <div className="w-px flex-1 bg-border mt-2" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge
                                  variant={
                                    interacao.tipo === "criacao"
                                      ? "outline"
                                      : interacao.tipo === "status_change"
                                      ? "default"
                                      : "secondary"
                                  }
                                  className={cn(
                                    "text-xs",
                                    interacao.tipo === "criacao" && "border-green-500/50 text-green-600"
                                  )}
                                >
                                  {interacao.tipo === "criacao"
                                    ? "Criação"
                                    : interacao.tipo === "status_change"
                                    ? "Mudança de Status"
                                    : "Observação"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(
                                    new Date(interacao.created_at),
                                    "dd/MM/yyyy 'às' HH:mm",
                                    { locale: ptBR }
                                  )}
                                </span>
                              </div>
                              <p className="text-sm">{interacao.descricao}</p>
                              {interacao.status_anterior && interacao.status_novo && (
                                <div className="flex items-center gap-2 mt-2 text-xs">
                                  <Badge variant="outline">{interacao.status_anterior}</Badge>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <Badge variant="outline">{interacao.status_novo}</Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="oportunidades" className="flex-1 overflow-hidden mt-4">
            <OportunidadesTab leadId={lead.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
