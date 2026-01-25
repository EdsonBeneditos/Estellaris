import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumoFinanceiro } from "@/hooks/useDashboardData";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

interface WidgetResumoFinanceiroProps {
  enabled: boolean;
}

export function WidgetResumoFinanceiro({ enabled }: WidgetResumoFinanceiroProps) {
  const { data, isLoading } = useResumoFinanceiro(enabled);

  if (!enabled) return null;

  return (
    <Card className="relative bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-primary/40 hover:z-50">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-700 dark:text-zinc-200">
          <Wallet className="h-5 w-5 text-emerald-600" />
          Resumo Financeiro (Mês)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-visible">
            {/* Entradas */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Entradas</span>
              </div>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrency(data?.entradas || 0)}
              </span>
            </div>

            {/* Saídas */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-900/50">
                  <TrendingDown className="h-4 w-4 text-rose-600" />
                </div>
                <span className="text-sm font-medium text-rose-700 dark:text-rose-300">Saídas</span>
              </div>
              <span className="text-base font-bold text-rose-700 dark:text-rose-300">
                {formatCurrency(data?.saidas || 0)}
              </span>
            </div>

            {/* Saldo */}
            <div className={`flex items-center justify-between p-3 rounded-lg border ${
              (data?.saldo || 0) >= 0 
                ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50"
                : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  (data?.saldo || 0) >= 0 
                    ? "bg-blue-100 dark:bg-blue-900/50"
                    : "bg-amber-100 dark:bg-amber-900/50"
                }`}>
                  <DollarSign className={`h-4 w-4 ${
                    (data?.saldo || 0) >= 0 ? "text-blue-600" : "text-amber-600"
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  (data?.saldo || 0) >= 0 
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}>Saldo</span>
              </div>
              <span className={`text-base font-bold ${
                (data?.saldo || 0) >= 0 
                  ? "text-blue-700 dark:text-blue-300"
                  : "text-amber-700 dark:text-amber-300"
              }`}>
                {formatCurrency(data?.saldo || 0)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
