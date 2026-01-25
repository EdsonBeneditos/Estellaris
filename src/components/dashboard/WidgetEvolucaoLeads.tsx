import { TrendingUp, Users, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { useEvolucaoLeads } from "@/hooks/useDashboardData";

const chartConfig = {
  total: {
    label: "Total",
    color: "hsl(215, 70%, 50%)",
  },
  convertidos: {
    label: "Convertidos",
    color: "hsl(142, 71%, 45%)",
  },
};

interface WidgetEvolucaoLeadsProps {
  enabled: boolean;
}

export function WidgetEvolucaoLeads({ enabled }: WidgetEvolucaoLeadsProps) {
  const { data, isLoading } = useEvolucaoLeads(enabled);

  if (!enabled) return null;

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800 col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg font-semibold text-slate-700 dark:text-zinc-200">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Evolução de Leads (6 meses)
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-bold text-slate-700 dark:text-zinc-200">
                {data?.totalLeads || 0}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-emerald-600" />
              <span className="text-muted-foreground">Conversão:</span>
              <span className="font-bold text-emerald-600">
                {data?.taxaConversao || 0}%
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : !data?.chartData || data.chartData.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Sem dados suficientes</p>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart
              data={data.chartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(215, 70%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(215, 70%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConvertidos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(215, 70%, 50%)"
                fillOpacity={1}
                fill="url(#colorTotal)"
                strokeWidth={2}
                name="Total"
              />
              <Area
                type="monotone"
                dataKey="convertidos"
                stroke="hsl(142, 71%, 45%)"
                fillOpacity={1}
                fill="url(#colorConvertidos)"
                strokeWidth={2}
                name="Convertidos"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
