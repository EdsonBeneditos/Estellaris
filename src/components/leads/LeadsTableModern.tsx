import { useState } from "react";
import { MessageCircle, Mail, Phone, Globe, MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ReturnBadge } from "./ReturnBadge";
import { EditLeadModal } from "./EditLeadModal";
import type { Lead } from "@/hooks/useLeads";

interface LeadsTableModernProps {
  leads: Lead[];
  isLoading?: boolean;
}

const statusStyles: Record<string, string> = {
  Novo: "bg-primary/10 text-primary border-primary/20 font-semibold",
  "Em Contato": "bg-amber-500/10 text-amber-600 border-amber-500/20 font-semibold",
  Qualificado: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold",
  "Proposta Enviada": "bg-violet-500/10 text-violet-600 border-violet-500/20 font-semibold",
  Negociação: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 font-semibold",
  Convertido: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-bold shadow-sm shadow-emerald-500/20",
  Perdido: "bg-rose-500/10 text-rose-700 border-rose-500/20 font-bold",
};

const getContactIcon = (meioContato: string | null) => {
  const meio = (meioContato || "").toLowerCase();
  
  if (meio.includes("whatsapp") || meio.includes("whats")) {
    return { icon: MessageCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" };
  }
  if (meio.includes("email") || meio.includes("e-mail")) {
    return { icon: Mail, color: "text-blue-500", bg: "bg-blue-500/10" };
  }
  if (meio.includes("telefone") || meio.includes("ligação") || meio.includes("call")) {
    return { icon: Phone, color: "text-violet-500", bg: "bg-violet-500/10" };
  }
  if (meio.includes("site") || meio.includes("web")) {
    return { icon: Globe, color: "text-amber-500", bg: "bg-amber-500/10" };
  }
  if (meio.includes("indicação") || meio.includes("indicacao")) {
    return { icon: Users, color: "text-pink-500", bg: "bg-pink-500/10" };
  }
  if (meio.includes("visita") || meio.includes("presencial")) {
    return { icon: MapPin, color: "text-cyan-500", bg: "bg-cyan-500/10" };
  }
  return { icon: MessageCircle, color: "text-muted-foreground", bg: "bg-muted" };
};

export function LeadsTableModern({ leads, isLoading }: LeadsTableModernProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
          <div className="absolute inset-0 animate-pulse rounded-full bg-primary/10" />
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
          <Users className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="font-medium">Nenhum lead encontrado</p>
        <p className="text-sm mt-1">Tente ajustar os filtros ou adicione um novo lead</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm">
        {/* Table Header */}
        <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-6 py-4 bg-muted/30 border-b border-border/50">
          <div className="text-sm font-bold text-foreground tracking-tight">Empresa</div>
          <div className="text-sm font-bold text-foreground tracking-tight">Contato</div>
          <div className="text-sm font-bold text-foreground tracking-tight">Meio de Contato</div>
          <div className="text-sm font-bold text-foreground tracking-tight">Vendedor</div>
          <div className="text-sm font-bold text-foreground tracking-tight">Status</div>
          <div className="text-sm font-bold text-foreground tracking-tight">Retorno</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-border/30">
          {leads.map((lead) => {
            const contactInfo = getContactIcon(lead.meio_contato);
            const ContactIcon = contactInfo.icon;

            return (
              <div
                key={lead.id}
                onClick={() => handleRowClick(lead)}
                className="group relative cursor-pointer transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent hover:scale-[1.005] hover:shadow-sm"
              >
                {/* Glassmorphism hover effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
                
                {/* Mobile Layout */}
                <div className="lg:hidden p-5 space-y-3 relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#003366] dark:text-blue-400">{lead.empresa || "—"}</p>
                      {lead.cnpj && (
                        <p className="text-xs text-[#4B5563] mt-0.5 font-mono">{lead.cnpj}</p>
                      )}
                      {lead.tipo_servico && (
                        <Badge variant="secondary" className="mt-1 text-xs font-normal px-1.5 py-0">
                          {lead.tipo_servico}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="outline" className={statusStyles[lead.status || ""] || ""}>
                      {lead.status || "Novo"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div>
                      <span className="font-semibold text-foreground">{lead.nome_contato || "—"}</span>
                      {lead.telefone && (
                        <span className="text-[#4B5563] ml-2">{lead.telefone}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${contactInfo.bg}`}>
                        <ContactIcon className={`h-4 w-4 ${contactInfo.color}`} />
                      </div>
                      <span className="font-semibold text-sm">{lead.meio_contato || "—"}</span>
                    </div>
                    <ReturnBadge date={lead.data_retorno} status={lead.status} />
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden lg:grid lg:grid-cols-6 gap-4 px-6 py-5 items-center relative">
                  {/* Empresa */}
                  <div>
                    <p className="font-bold text-[#003366] dark:text-blue-400 truncate">{lead.empresa || "—"}</p>
                    {lead.cnpj && (
                      <p className="text-xs text-[#4B5563] mt-0.5 font-mono truncate">{lead.cnpj}</p>
                    )}
                    {lead.tipo_servico && (
                      <Badge variant="secondary" className="mt-1 text-xs font-normal px-1.5 py-0 max-w-full truncate">
                        {lead.tipo_servico}
                      </Badge>
                    )}
                  </div>

                  {/* Contato */}
                  <div>
                    <p className="font-semibold text-foreground truncate">{lead.nome_contato || "—"}</p>
                    {lead.telefone && (
                      <p className="text-xs text-[#4B5563] mt-0.5 truncate">{lead.telefone}</p>
                    )}
                  </div>

                  {/* Meio de Contato */}
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${contactInfo.bg} transition-transform group-hover:scale-110`}>
                      <ContactIcon className={`h-4 w-4 ${contactInfo.color}`} />
                    </div>
                    <span className="font-semibold text-sm truncate">{lead.meio_contato || "—"}</span>
                  </div>

                  {/* Vendedor */}
                  <div>
                    <p className="font-semibold text-foreground truncate">{lead.vendedor || "—"}</p>
                  </div>

                  {/* Status */}
                  <div>
                    <Badge 
                      variant="outline" 
                      className={`${statusStyles[lead.status || ""] || ""} transition-all duration-300 group-hover:shadow-md`}
                    >
                      {lead.status || "Novo"}
                    </Badge>
                  </div>

                  {/* Retorno */}
                  <div>
                    <ReturnBadge date={lead.data_retorno} status={lead.status} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EditLeadModal
        lead={selectedLead}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </>
  );
}
