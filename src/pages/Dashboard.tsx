import { useState, useMemo } from "react";
import { Plus, Users, CalendarClock, FolderOpen, Filter, X, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { StatsCard } from "@/components/leads/StatsCard";
import { LeadsTableModern } from "@/components/leads/LeadsTableModern";
import { SearchBar } from "@/components/leads/SearchBar";
import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { DateRangePicker } from "@/components/leads/DateRangePicker";
import { useLeads, useLeadsStats } from "@/hooks/useLeads";
import { useActiveVendedores, useActiveTiposServico } from "@/hooks/useSettings";
import { useDashboardPreferences } from "@/hooks/useDashboardPreferences";
import { DashboardCustomizeModal } from "@/components/dashboard/DashboardCustomizeModal";
import { WidgetResumoFinanceiro } from "@/components/dashboard/WidgetResumoFinanceiro";
import { WidgetProximasVisitas } from "@/components/dashboard/WidgetProximasVisitas";
import { WidgetContratosVencer } from "@/components/dashboard/WidgetContratosVencer";
import { WidgetEvolucaoLeads } from "@/components/dashboard/WidgetEvolucaoLeads";
import { WidgetAtalhosRapidos } from "@/components/dashboard/WidgetAtalhosRapidos";
import { WidgetColaboradoresFerias } from "@/components/dashboard/WidgetColaboradoresFerias";
import { DateRange } from "react-day-picker";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

// Fixed colors for each salesperson
const VENDEDOR_COLORS: Record<string, string> = {
  "Maria Victoria": "hsl(210, 100%, 45%)",
  "Francielli": "hsl(142, 71%, 45%)",
  "Mikaela": "hsl(280, 70%, 50%)",
  "Cleriston": "hsl(25, 95%, 53%)",
  "Roberto": "hsl(340, 75%, 55%)",
};

const DEFAULT_VENDEDOR_COLOR = "hsl(215, 20%, 60%)";

const chartConfig = {
  count: {
    label: "Leads",
    color: "hsl(var(--primary))",
  },
};

export default function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendedorFilter, setVendedorFilter] = useState<string>("all");
  const [servicoFilter, setServicoFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");

  const { widgets, updateWidget, resetToDefaults, activeWidgetCount } = useDashboardPreferences();
  
  const { data: leads = [], isLoading: leadsLoading } = useLeads();
  const { data: stats, isLoading: statsLoading } = useLeadsStats();
  const { data: vendedores = [] } = useActiveVendedores();
  const { data: tiposServico = [] } = useActiveTiposServico();

  // Filter out "Perdido" status leads and sort by most recent
  const activeLeads = useMemo(() => {
    return leads
      .filter((lead) => lead.status !== "Perdido")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [leads]);

  // Group leads by month (using activeLeads)
  const groupedLeads = useMemo(() => {
    const groups: Record<string, typeof activeLeads> = {};
    
    activeLeads.forEach((lead) => {
      const monthKey = lead.mes_referencia || lead.created_at.slice(0, 7);
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(lead);
    });

    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [activeLeads]);

  // Vendedor stats for chart
  const vendedorStats = useMemo(() => {
    const counts: Record<string, number> = {};
    activeLeads.forEach((lead) => {
      const vendedor = lead.vendedor || "Não atribuído";
      counts[vendedor] = (counts[vendedor] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([vendedor, count]) => ({ 
        vendedor, 
        count,
        color: VENDEDOR_COLORS[vendedor] || DEFAULT_VENDEDOR_COLOR 
      }))
      .sort((a, b) => b.count - a.count);
  }, [activeLeads]);

  // Apply filters
  const filteredLeads = useMemo(() => {
    return activeLeads.filter((lead) => {
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

      let matchSearch = true;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        matchSearch = 
          (lead.empresa?.toLowerCase().includes(query)) ||
          (lead.nome_contato?.toLowerCase().includes(query)) ||
          (lead.vendedor?.toLowerCase().includes(query)) ||
          false;
      }

      return matchVendedor && matchServico && matchDate && matchSearch;
    });
  }, [activeLeads, vendedorFilter, servicoFilter, dateRange, searchQuery]);

  const hasActiveFilters =
    vendedorFilter !== "all" || servicoFilter !== "all" || dateRange !== undefined || searchQuery.trim() !== "";

  const clearFilters = () => {
    setVendedorFilter("all");
    setServicoFilter("all");
    setDateRange(undefined);
    setSearchQuery("");
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return format(date, "MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1 truncate">
            Central de gestão e acompanhamento
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DashboardCustomizeModal
            widgets={widgets}
            onUpdateWidget={updateWidget}
            onReset={resetToDefaults}
            activeCount={activeWidgetCount}
          />
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Widget Grid - Responsive layout with padding for hover effects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1 -m-1">
        <WidgetResumoFinanceiro enabled={widgets.resumoFinanceiro} />
        <WidgetProximasVisitas enabled={widgets.proximasVisitas} />
        <WidgetContratosVencer enabled={widgets.contratosVencer} />
        <WidgetEvolucaoLeads enabled={widgets.evolucaoLeads} />
        <WidgetAtalhosRapidos 
          enabled={widgets.atalhosRapidos} 
          onNewLead={() => setIsModalOpen(true)}
        />
        <WidgetColaboradoresFerias />
      </div>

      {/* Stats Cards - 4 columns grid with padding for hover effects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-1 -m-1">
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
        <StatsCard
          title="Leads em Atraso"
          value={statsLoading ? "..." : stats?.overdueLeads || 0}
          icon={AlertTriangle}
          description="Retornos não realizados"
          variant="danger"
        />
      </div>

      {/* Global Search Bar */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar por empresa, contato ou vendedor..."
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 p-4 rounded-lg bg-muted/50 border border-border">
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

        <div className="flex items-center gap-2 sm:ml-auto">
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
            <span className="text-sm text-muted-foreground">
              {filteredLeads.length} lead(s)
            </span>
          )}
        </div>
      </div>

      {/* Leads Table - Grouped by Month when no filters */}
      {!hasActiveFilters ? (
        <div className="space-y-8">
          {groupedLeads.map(([monthKey, monthLeads]) => (
            <div key={monthKey}>
              <h2 className="text-lg font-semibold text-foreground mb-4 capitalize">
                {formatMonthLabel(monthKey)}
              </h2>
              <LeadsTableModern leads={monthLeads} isLoading={leadsLoading} />
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
          <LeadsTableModern leads={filteredLeads} isLoading={leadsLoading} />
        </div>
      )}

      {/* Desempenho por Vendedor Chart */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Desempenho por Vendedor
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {leadsLoading ? (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground">
              Carregando...
            </div>
          ) : vendedorStats.length === 0 ? (
            <div className="h-[320px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[320px] w-full min-w-[300px]">
              <BarChart
                data={vendedorStats}
                layout="horizontal"
                margin={{ top: 20, right: 20, left: 10, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="vendedor"
                  type="category"
                  tick={{ fontSize: 11 }}
                  angle={-35}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  type="number"
                  allowDecimals={false}
                  tickFormatter={(value) => Math.floor(value).toString()}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Leads" barSize={32}>
                  {vendedorStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* New Lead Modal */}
      <NewLeadModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
