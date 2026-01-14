import { useState, useMemo } from "react";
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
import { DateRangePicker } from "@/components/leads/DateRangePicker";
import { useLeads, useLeadsStats } from "@/hooks/useLeads";
import { useActiveVendedores, useActiveTiposServico } from "@/hooks/useSettings";
import { DateRange } from "react-day-picker";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendedorFilter, setVendedorFilter] = useState<string>("all");
  const [servicoFilter, setServicoFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: stats, isLoading: statsLoading } = useLeadsStats();
  const { data: vendedores = [] } = useActiveVendedores();
  const { data: tiposServico = [] } = useActiveTiposServico();

  // Group leads by month
  const groupedLeads = useMemo(() => {
    const groups: Record<string, typeof leads> = {};
    
    leads.forEach((lead) => {
      const monthKey = lead.mes_referencia || lead.created_at.slice(0, 7);
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(lead);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [leads]);

  // Apply filters
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchVendedor =
        vendedorFilter === "all" || lead.vendedor === vendedorFilter;
      const matchServico =
        servicoFilter === "all" || lead.tipo_servico === servicoFilter;
      
      let matchDate = true;
      if (dateRange?.from) {
        const leadDate = parseISO(lead.created_at);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        matchDate = isWithinInterval(leadDate, { start: from, end: to });
      }

      return matchVendedor && matchServico && matchDate;
    });
  }, [leads, vendedorFilter, servicoFilter, dateRange]);

  const hasActiveFilters =
    vendedorFilter !== "all" || servicoFilter !== "all" || dateRange !== undefined;

  const clearFilters = () => {
    setVendedorFilter("all");
    setServicoFilter("all");
    setDateRange(undefined);
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e acompanhe o progresso
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <SelectTrigger className="w-full sm:w-[180px] bg-background">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Vendedores</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={v.nome}>
                {v.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={servicoFilter} onValueChange={setServicoFilter}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background">
            <SelectValue placeholder="Tipo de Serviço" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Serviços</SelectItem>
            {tiposServico.map((s) => (
              <SelectItem key={s.id} value={s.nome}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          className="w-full sm:w-auto"
        />

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

      {/* Leads Table - Grouped by Month when no filters */}
      {!hasActiveFilters ? (
        <div className="space-y-8">
          {groupedLeads.map(([monthKey, monthLeads]) => (
            <div key={monthKey}>
              <h2 className="text-lg font-semibold text-foreground mb-4 capitalize">
                {formatMonthLabel(monthKey)}
              </h2>
              <LeadsTable leads={monthLeads} isLoading={leadsLoading} />
            </div>
          ))}
          {groupedLeads.length === 0 && !leadsLoading && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum lead encontrado.
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Resultados Filtrados
          </h2>
          <LeadsTable leads={filteredLeads} isLoading={leadsLoading} />
        </div>
      )}

      {/* New Lead Modal */}
      <NewLeadModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
