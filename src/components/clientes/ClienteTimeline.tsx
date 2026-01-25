import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Settings, RefreshCw, Send, Loader2 } from "lucide-react";
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
}

function getIconForType(tipo: AtividadeCliente["tipo"]) {
  switch (tipo) {
    case "Nota":
      return <FileText className="h-4 w-4 text-blue-600" />;
    case "Sistema":
      return <Settings className="h-4 w-4 text-slate-500" />;
    case "Contrato":
      return <RefreshCw className="h-4 w-4 text-green-600" />;
    default:
      return <FileText className="h-4 w-4 text-slate-400" />;
  }
}

function getBadgeColor(tipo: AtividadeCliente["tipo"]) {
  switch (tipo) {
    case "Nota":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Sistema":
      return "bg-slate-50 text-slate-700 border-slate-200";
    case "Contrato":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export function ClienteTimeline({ clienteId }: ClienteTimelineProps) {
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
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <label className="block text-sm font-medium text-zinc-950 mb-2">
          Adicionar Nota
        </label>
        <div className="flex gap-2">
          <Textarea
            placeholder="Registre uma visita, ligação ou observação..."
            value={novaNota}
            onChange={(e) => setNovaNota(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[60px] bg-white border-slate-300 text-zinc-950 placeholder:text-slate-400 resize-none"
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
        <p className="text-xs text-slate-500 mt-1">
          Pressione Enter para enviar ou Shift+Enter para nova linha
        </p>
      </div>

      {/* Timeline */}
      <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h4 className="text-sm font-semibold text-zinc-950">
            Histórico de Atividades
          </h4>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
            <p className="text-sm text-slate-500 mt-2">Carregando...</p>
          </div>
        ) : atividades.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-8 w-8 mx-auto text-slate-300" />
            <p className="text-sm text-slate-500 mt-2">
              Nenhuma atividade registrada
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Adicione uma nota acima para começar
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {atividades.map((atividade, index) => (
              <div
                key={atividade.id}
                className="px-4 py-3 hover:bg-slate-100/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-0.5 p-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                    {getIconForType(atividade.tipo)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${getBadgeColor(
                          atividade.tipo
                        )}`}
                      >
                        {atividade.tipo}
                      </span>
                      <span className="text-xs text-slate-500">
                        {format(
                          new Date(atividade.data_hora),
                          "dd/MM/yyyy 'às' HH:mm",
                          { locale: ptBR }
                        )}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-950 mt-1 whitespace-pre-wrap break-words">
                      {atividade.descricao}
                    </p>

                    {atividade.realizado_por_email && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-slate-500 mt-1 cursor-default truncate max-w-[200px]">
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
                {index < atividades.length - 1 && (
                  <div className="ml-[18px] mt-2 h-4 w-px bg-slate-200" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
