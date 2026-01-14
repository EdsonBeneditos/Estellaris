import { useState } from "react";
import { Plus, Users, CalendarClock, FolderOpen, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsCard } from "@/components/leads/StatsCard";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { useLeads, useLeadsStats } from "@/hooks/useLeads";
import { VENDEDORES, TIPOS_SERVICO } from "@/lib/constants";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendedorFilter, setVendedorFilter] = useState<string>("all");
  const [servicoFilter, setServicoFilter] = useState<string>("all");
  
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: stats, isLoading: statsLoading } = useLeadsStats();

  // Apply filters
  const filteredLeads = leads.filter((lead) => {
    const matchVendedor =
      vendedorFilter === "all" || lead.vendedor === vendedorFilter;
    const matchServico =
      servicoFilter === "all" || lead.tipo_servico === servicoFilter;
    return matchVendedor && matchServico;
  });

  const hasActiveFilters = vendedorFilter !== "all" || servicoFilter !== "all";

  const clearFilters = () => {
    setVendedorFilter("all");
    setServicoFilter("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e acompanhe o progresso
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total de Leads (Mês)"
          value={statsLoading ? "..." : stats?.totalMonth || 0}
          icon={Users}
          description="Leads captados este mês"
        />
        <StatsCard
          title="Retornos para Hoje"
          value={statsLoading ? "..." : stats?.todayReturns || 0}
          icon={CalendarClock}
          description="Leads com retorno programado"
        />
        <StatsCard
          title="Leads em Aberto"
          value={statsLoading ? "..." : stats?.openLeads || 0}
          icon={FolderOpen}
          description="Leads ativos aguardando fechamento"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>
        
        <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Vendedores</SelectItem>
            {VENDEDORES.map((vendedor) => (
              <SelectItem key={vendedor} value={vendedor}>
                {vendedor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={servicoFilter} onValueChange={setServicoFilter}>
          <SelectTrigger className="w-[200px] bg-background">
            <SelectValue placeholder="Tipo de Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Serviços</SelectItem>
            {TIPOS_SERVICO.map((servico) => (
              <SelectItem key={servico} value={servico}>
                {servico}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Limpar
          </Button>
        )}

        {hasActiveFilters && (
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredLeads.length} lead(s) encontrado(s)
          </span>
        )}
      </div>

      {/* Leads Table */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Últimos Leads
        </h2>
        <LeadsTable leads={filteredLeads} isLoading={leadsLoading} />
      </div>

      {/* New Lead Modal */}
      <NewLeadModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
