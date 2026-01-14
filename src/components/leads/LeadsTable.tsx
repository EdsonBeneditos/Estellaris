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
import type { Lead } from "@/hooks/useLeads";

interface LeadsTableProps {
  leads: Lead[];
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  Novo: "bg-primary/10 text-primary border-primary/20",
  "Em Contato": "bg-warning/10 text-warning border-warning/20",
  Qualificado: "bg-success/10 text-success border-success/20",
  Convertido: "bg-success text-success-foreground",
  Perdido: "bg-destructive/10 text-destructive border-destructive/20",
  Fechado: "bg-muted text-muted-foreground",
};

export function LeadsTable({ leads, isLoading }: LeadsTableProps) {
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
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold">Empresa</TableHead>
            <TableHead className="font-semibold">Contato</TableHead>
            <TableHead className="font-semibold">Meio de Contato</TableHead>
            <TableHead className="font-semibold">Vendedor</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Retorno</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id} className="hover:bg-muted/30">
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
              <TableCell>
                <div>
                  <p className="text-foreground">{lead.nome_contato || "—"}</p>
                  {lead.telefone && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lead.telefone}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {lead.meio_contato || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
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
              <TableCell>
                <ReturnBadge date={lead.data_retorno} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
