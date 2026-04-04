import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Settings, RefreshCw, Send, Loader2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useAtividadesCliente,
  useCreateAtividade,
  AtividadeCliente,
} from "@/hooks/useAtividadesCliente";

interface ClienteTimelineProps {
  clienteId: string;
  createdAt?: string;
}

function getIconForType(tipo: AtividadeCliente["tipo"] | "Cadastro") {
  switch (tipo) {
    case "Nota":
      return <FileText className="h-4 w-4 text-blue-600" />;
    case "Sistema":
      return <Settings className="h-4 w-4 text-slate-500" />;
    case "Contrato":
      return <RefreshCw className="h-4 w-4 text-green-600" />;
    case "Cadastro":
      return <PlusCircle className="h-4 w-4 text-emerald-600" />;
    default:
      return <FileText className="h-4 w-4 text-slate-400" />;
  }
}

function getBadgeColor(tipo: AtividadeCliente["tipo"] | "Cadastro") {
  switch (tipo) {
    case "Nota":
      return "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800";
    case "Sistema":
      return "bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    case "Contrato":
      return "bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800";
    case "Cadastro":
      return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
    default:
      return "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  }
}

export function ClienteTimeline({ clienteId, createdAt }: ClienteTimelineProps) {
  const { data: atividades = [], isLoading } = useAtividadesCliente(clienteId);
  const createAtividade = useCreateAtividade();
  const [novaNota, setNovaNota] = useState("");

  const handleAddNota = async () => {
    if (!novaNota.trim()) return;

    await createAtividade.mutateAsync({
      cliente_id: clienteId,
      tipo: "Nota",
      descricao: novaNota.trim(),
    });

    setNovaNota("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddNota();
    }
  };

  return (
    <div className="space-y-4">
      {/* Campo para adicionar nota */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg p-4 border border-slate-200 dark:border-zinc-700">
        <label className="block text-sm font-medium text-zinc-950 dark:text-zinc-50 mb-2">
          Adicionar Nota
        </label>
        <div className="flex gap-2">
          <Textarea
            placeholder="Registre uma visita, ligação ou observação..."
            value={novaNota}
            onChange={(e) => setNovaNota(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] bg-white dark:bg-zinc-900 border-slate-300 dark:border-zinc-600 text-zinc-950 dark:text-zinc-50 placeholder:text-slate-400 dark:placeholder:text-zinc-500 resize-none"
            disabled={createAtividade.isPending}
          />
          <Button
            onClick={handleAddNota}
            disabled={!novaNota.trim() || createAtividade.isPending}
            size="icon"
            className="h-[60px] w-12 shrink-0"
          >
            {createAtividade.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          Pressione Enter para enviar ou Shift+Enter para nova linha
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-200 dark:border-zinc-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-700">
          <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            Histórico de Atividades
          </h4>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">Carregando...</p>
          </div>
        ) : (
          (() => {
            const hasCadastroRecord = atividades.some(
              (a) => a.tipo === "Sistema" && a.descricao?.startsWith("Cliente cadastrado")
            );

            type DisplayAtividade = (AtividadeCliente & { isSyntheticCadastro?: false }) | {
              id: string;
              tipo: "Cadastro";
              descricao: string;
              data_hora: string;
              realizado_por_email: null;
              isSyntheticCadastro: true;
            };

            const displayList: DisplayAtividade[] = [
              ...atividades,
              ...(!hasCadastroRecord && createdAt
                ? [{
                    id: "__cadastro__",
                    tipo: "Cadastro" as const,
                    descricao: "Cliente cadastrado",
                    data_hora: createdAt,
                    realizado_por_email: null,
                    isSyntheticCadastro: true as const,
                  }]
                : []),
            ];

            if (displayList.length === 0) {
              return (
                <div className="p-8 text-center">
                  <FileText className="h-8 w-8 mx-auto text-slate-300 dark:text-zinc-600" />
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">
                    Nenhuma atividade registrada
                  </p>
                  <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">
                    Adicione uma nota acima para começar
                  </p>
                </div>
              );
            }

            return (
              <div className="divide-y divide-slate-100 dark:divide-zinc-700">
                {displayList.map((atividade, index) => (
                  <div
                    key={atividade.id}
                    className="px-4 py-3 hover:bg-slate-100/50 dark:hover:bg-zinc-700/30 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="mt-0.5 p-1.5 rounded-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-600 shadow-sm">
                        {getIconForType(atividade.tipo as AtividadeCliente["tipo"] | "Cadastro")}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${getBadgeColor(
                              atividade.tipo as AtividadeCliente["tipo"] | "Cadastro"
                            )}`}
                          >
                            {atividade.tipo === "Cadastro" ? "Cadastro" : atividade.tipo}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-zinc-400">
                            {format(
                              new Date(atividade.data_hora),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>

                        <p className="text-sm text-zinc-950 dark:text-zinc-100 mt-1 whitespace-pre-wrap break-words">
                          {atividade.descricao}
                        </p>

                        {"realizado_por_email" in atividade && atividade.realizado_por_email && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 cursor-default truncate max-w-[200px]">
                                Por: {atividade.realizado_por_email.split("@")[0]}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              {atividade.realizado_por_email}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Linha de conexão (exceto último item) */}
                    {index < displayList.length - 1 && (
                      <div className="ml-[18px] mt-2 h-4 w-px bg-slate-200 dark:bg-zinc-600" />
                    )}
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
