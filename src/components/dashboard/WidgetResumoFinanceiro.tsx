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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 overflow-visible">
            {/* Entradas */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="shrink-0 p-2.5 rounded-full bg-emerald-100 dark:bg-emerald-900">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">Entradas</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-emerald-700 dark:text-emerald-300 break-words leading-tight">
                  {formatCurrency(data?.entradas || 0)}
                </p>
              </div>
            </div>

            {/* Saídas */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
              <div className="shrink-0 p-2.5 rounded-full bg-rose-100 dark:bg-rose-900">
                <TrendingDown className="h-5 w-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">Saídas</p>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-rose-700 dark:text-rose-300 break-words leading-tight">
                  {formatCurrency(data?.saidas || 0)}
                </p>
              </div>
            </div>

            {/* Saldo */}
            <div className={`flex items-start gap-4 p-4 rounded-xl border ${
              (data?.saldo || 0) >= 0 
                ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
                : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800"
            }`}>
              <div className={`shrink-0 p-2.5 rounded-full ${
                (data?.saldo || 0) >= 0 
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "bg-amber-100 dark:bg-amber-900"
              }`}>
                <DollarSign className={`h-5 w-5 ${
                  (data?.saldo || 0) >= 0 
                    ? "text-blue-600"
                    : "text-amber-600"
                }`} />
              </div>
              <div className="flex-1">
                <p className={`text-xs font-medium mb-1 ${
                  (data?.saldo || 0) >= 0 
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}>Saldo</p>
                <p className={`text-sm sm:text-base lg:text-lg font-bold break-words leading-tight ${
                  (data?.saldo || 0) >= 0 
                    ? "text-blue-700 dark:text-blue-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}>
                  {formatCurrency(data?.saldo || 0)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
