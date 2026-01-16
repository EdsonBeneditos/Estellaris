import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, History, MessageSquare, ArrowRight, Trash2 } from "lucide-react";

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
import {
  useLeadInteracoes,
  useCreateInteracao,
} from "@/hooks/useLeadInteracoes";
import { useActiveVendedores } from "@/hooks/useSettings";
import { usePermissions } from "@/hooks/usePermissions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { STATUS_OPTIONS, PRIORIDADES } from "@/lib/constants";

// Schema with conditional validation for motivo_perda
const formSchema = z.object({
  status: z.string().optional(),
  prioridade: z.string().optional(),
  vendedor: z.string().optional(),
  data_retorno: z.date().optional().nullable(),
  proximo_passo: z.string().optional(),
  motivo_perda: z.string().optional(),
}).refine((data) => {
  // If status is "Perdido", motivo_perda is required
  if (data.status === "Perdido") {
    return data.motivo_perda && data.motivo_perda.trim().length > 0;
  }
  return true;
}, {
  message: "O motivo da perda é obrigatório quando o status é 'Perdido'",
  path: ["motivo_perda"],
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
  const { data: vendedores = [] } = useActiveVendedores();
  const { data: interacoes = [], isLoading: interacoesLoading } =
    useLeadInteracoes(lead?.id || "");
  const { canDeleteLeads } = usePermissions();

  const [observacao, setObservacao] = useState("");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const watchedStatus = form.watch("status");

  useEffect(() => {
    if (lead) {
      form.reset({
        status: lead.status || "Novo",
        prioridade: lead.prioridade || "",
        vendedor: lead.vendedor || "",
        data_retorno: lead.data_retorno ? new Date(lead.data_retorno) : null,
        proximo_passo: lead.proximo_passo || "",
        motivo_perda: lead.motivo_perda || "",
      });
    }
  }, [lead, form]);

  const onSubmit = async (data: FormData) => {
    if (!lead) return;

    try {
      const previousStatus = lead.status;
      const newStatus = data.status;

      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          ...data,
          data_retorno: data.data_retorno?.toISOString() || null,
          motivo_perda: data.status === "Perdido" ? data.motivo_perda : null,
        },
      });

      // Create interaction record if status changed
      if (previousStatus !== newStatus) {
        let descricao = `Status alterado de "${previousStatus || "Novo"}" para "${newStatus}"`;
        if (newStatus === "Perdido" && data.motivo_perda) {
          descricao += `. Motivo: ${data.motivo_perda}`;
        }
        
        await createInteracao.mutateAsync({
          lead_id: lead.id,
          tipo: "status_change",
          descricao,
          status_anterior: previousStatus || "Novo",
          status_novo: newStatus,
        });
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="editar">Editar</TabsTrigger>
            <TabsTrigger value="historico" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
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
                  <FormField
                    control={form.control}
                    name="motivo_perda"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-destructive">
                          Motivo da Perda *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva o motivo da perda deste lead..."
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

                {/* Vendedor e Data de Retorno */}
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
                </div>

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
            <ScrollArea className="h-[400px] pr-4">
              {interacoesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : interacoes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma interação registrada.
                </div>
              ) : (
                <div className="space-y-4">
                  {interacoes.map((interacao) => (
                    <div
                      key={interacao.id}
                      className="p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          {interacao.tipo === "status_change" ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {interacao.status_anterior}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge className="text-xs">
                                {interacao.status_novo}
                              </Badge>
                            </div>
                          ) : (
                            <p className="text-sm">{interacao.descricao}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(
                            new Date(interacao.created_at),
                            "dd/MM/yy HH:mm",
                            { locale: ptBR }
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
