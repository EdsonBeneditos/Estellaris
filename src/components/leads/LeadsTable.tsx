import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ReturnBadge } from "./ReturnBadge";
import { EditLeadModal } from "./EditLeadModal";
import type { Lead } from "@/hooks/useLeads";

interface LeadsTableProps {
  leads: Lead[];
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  Novo: "bg-primary/10 text-primary border-primary/20",
  "Em Contato": "bg-warning/10 text-warning border-warning/20",
  Qualificado: "bg-success/10 text-success border-success/20",
  "Proposta Enviada": "bg-chart-4/10 text-chart-4 border-chart-4/20",
  Negociação: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  Convertido: "bg-success text-success-foreground",
  Perdido: "bg-destructive/10 text-destructive border-destructive/20",
};

export function LeadsTable({ leads, isLoading }: LeadsTableProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleRowClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhum lead encontrado.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold">Empresa</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Contato</TableHead>
              <TableHead className="font-semibold hidden md:table-cell">Meio de Contato</TableHead>
              <TableHead className="font-semibold hidden lg:table-cell">Vendedor</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold hidden sm:table-cell">Retorno</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow
                key={lead.id}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => handleRowClick(lead)}
              >
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">
                      {lead.empresa || "—"}
                    </p>
                    {lead.cnpj && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lead.cnpj}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div>
                    <p className="text-foreground">{lead.nome_contato || "—"}</p>
                    {lead.telefone && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lead.telefone}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground hidden md:table-cell">
                  {lead.meio_contato || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground hidden lg:table-cell">
                  {lead.vendedor || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusColors[lead.status || ""] || ""}
                  >
                    {lead.status || "Novo"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <ReturnBadge date={lead.data_retorno} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EditLeadModal
        lead={selectedLead}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
      />
    </>
  );
}
