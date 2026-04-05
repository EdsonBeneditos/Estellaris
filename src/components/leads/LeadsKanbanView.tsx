import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EditLeadModal } from "./EditLeadModal";
import { ReturnBadge } from "./ReturnBadge";
import type { Lead } from "@/hooks/useLeads";
import { Building2, User, Phone } from "lucide-react";

const STATUS_COLUMNS = [
  "Novo",
  "Em Contato",
  "Qualificado",
  "Proposta Enviada",
  "Negociação",
  "Convertido",
  "Perdido",
];

const statusColors: Record<string, { header: string; card: string; badge: string }> = {
  Novo: {
    header: "bg-blue-900 dark:bg-blue-950",
    card: "border-blue-200 dark:border-blue-800/40",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  "Em Contato": {
    header: "bg-amber-800 dark:bg-amber-950",
    card: "border-amber-200 dark:border-amber-800/40",
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  Qualificado: {
    header: "bg-emerald-900 dark:bg-emerald-950",
    card: "border-emerald-200 dark:border-emerald-800/40",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  "Proposta Enviada": {
    header: "bg-violet-900 dark:bg-violet-950",
    card: "border-violet-200 dark:border-violet-800/40",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  },
  Negociação: {
    header: "bg-cyan-900 dark:bg-cyan-950",
    card: "border-cyan-200 dark:border-cyan-800/40",
    badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  },
  Convertido: {
    header: "bg-green-900 dark:bg-green-950",
    card: "border-green-200 dark:border-green-800/40",
    badge: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  Perdido: {
    header: "bg-rose-900 dark:bg-rose-950",
    card: "border-rose-200 dark:border-rose-800/40",
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  },
};

interface LeadsKanbanViewProps {
  leads: Lead[];
  isLoading?: boolean;
}

export function LeadsKanbanView({ leads, isLoading }: LeadsKanbanViewProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  const groupedByStatus = STATUS_COLUMNS.reduce((acc, status) => {
    acc[status] = leads.filter((l) => (l.status || "Novo") === status);
    return acc;
  }, {} as Record<string, Lead[]>);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: "400px" }}>
        {STATUS_COLUMNS.map((status) => {
          const columnLeads = groupedByStatus[status] || [];
          const colors = statusColors[status] || statusColors["Novo"];

          return (
            <div
              key={status}
              className="flex-shrink-0 w-56 flex flex-col rounded-xl border border-border/50 bg-card/50 overflow-hidden"
            >
              {/* Column Header */}
              <div className={`px-3 py-2.5 flex items-center justify-between ${colors.header}`}>
                <span className="text-sm font-semibold text-white truncate">{status}</span>
                <span className="text-xs font-bold bg-white/20 text-white rounded-full px-2 py-0.5 ml-1 shrink-0">
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex-1 p-2 space-y-2 overflow-y-auto" style={{ maxHeight: "560px" }}>
                {columnLeads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground/50 text-xs">
                    Nenhum lead
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsEditModalOpen(true);
                      }}
                      className={`w-full text-left rounded-lg border p-3 bg-card transition-all duration-200 hover:shadow-sm hover:bg-primary/[0.03] hover:border-primary/30 space-y-2 ${colors.card}`}
                    >
                      {/* Company */}
                      <div className="flex items-start gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                            {lead.empresa || "—"}
                          </p>
                          {Array.isArray(lead.tipo_servico) && lead.tipo_servico.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {lead.tipo_servico.map((s) => <Badge key={s} variant="secondary" className="text-xs font-normal px-1.5 py-0">{s}</Badge>)}
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Contact */}
                      {lead.nome_contato && (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{lead.nome_contato}</p>
                        </div>
                      )}

                      {/* Phone */}
                      {lead.telefone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <p className="text-xs text-muted-foreground truncate">{lead.telefone}</p>
                        </div>
                      )}

                      {/* Vendedor + Return date */}
                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/40">
                        {lead.vendedor && (
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {lead.vendedor}
                          </span>
                        )}
                        {lead.data_retorno && (
                          <div className="shrink-0">
                            <ReturnBadge date={lead.data_retorno} status={lead.status} />
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <EditLeadModal
        lead={selectedLead}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </>
  );
}
