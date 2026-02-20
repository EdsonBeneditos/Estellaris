import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard, Banknote, Smartphone, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TotalizadoresCardProps {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  porFormaPagamento: Record<string, number>;
  valoresVisiveis?: boolean;
  periodLabel?: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const maskedValue = "R$ ••••";

const getDynamicFontClass = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return "text-xs sm:text-sm lg:text-base";
  if (abs >= 1_000_000) return "text-sm sm:text-base lg:text-lg";
  if (abs >= 100_000) return "text-base sm:text-lg lg:text-xl";
  return "text-xl sm:text-2xl lg:text-3xl";
};

const formasPagamentoIcons: Record<string, React.ReactNode> = {
  Pix: <Smartphone className="h-4 w-4 flex-shrink-0" />,
  "Cartão Débito": <CreditCard className="h-4 w-4 flex-shrink-0" />,
  "Cartão Crédito": <CreditCard className="h-4 w-4 flex-shrink-0" />,
  Dinheiro: <Banknote className="h-4 w-4 flex-shrink-0" />,
  Boleto: <Building2 className="h-4 w-4 flex-shrink-0" />,
  Transferência: <Building2 className="h-4 w-4 flex-shrink-0" />,
};

export function TotalizadoresCard({
  totalEntradas,
  totalSaidas,
  saldoLiquido,
  porFormaPagamento,
  valoresVisiveis = false,
  periodLabel = "Neste mês",
}: TotalizadoresCardProps) {
  const displayValue = (value: number) => valoresVisiveis ? formatCurrency(value) : maskedValue;

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 p-1 -m-1">
      {/* Total Entradas */}
      <Card className="relative border-border/50 bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Entradas
          </CardTitle>
          <ArrowUpCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className={cn(getDynamicFontClass(totalEntradas), "font-bold text-emerald-600 whitespace-nowrap overflow-hidden text-ellipsis leading-tight")} title={formatCurrency(totalEntradas)}>
            {displayValue(totalEntradas)}
          </div>
          <Badge variant="secondary" className="mt-2 text-xs font-normal">{periodLabel}</Badge>
        </CardContent>
      </Card>

      {/* Total Saídas */}
      <Card className="relative border-border/50 bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Saídas
          </CardTitle>
          <ArrowDownCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div className={cn(getDynamicFontClass(totalSaidas), "font-bold text-red-600 whitespace-nowrap overflow-hidden text-ellipsis leading-tight")} title={formatCurrency(totalSaidas)}>
            {displayValue(totalSaidas)}
          </div>
          <Badge variant="secondary" className="mt-2 text-xs font-normal">{periodLabel}</Badge>
        </CardContent>
      </Card>

      {/* Saldo Líquido */}
      <Card className="relative border-border/50 bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo Líquido
          </CardTitle>
          <Wallet className="h-5 w-5 text-primary flex-shrink-0" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              getDynamicFontClass(saldoLiquido),
              "font-bold whitespace-nowrap overflow-hidden text-ellipsis leading-tight",
              saldoLiquido >= 0 ? "text-emerald-600" : "text-red-600"
            )}
            title={formatCurrency(saldoLiquido)}
          >
            {displayValue(saldoLiquido)}
          </div>
          <Badge variant="secondary" className="mt-2 text-xs font-normal">{periodLabel}</Badge>
        </CardContent>
      </Card>

      {/* Resumo por Forma de Pagamento */}
      <Card className="relative border-border/50 bg-card md:col-span-3 lg:col-span-1 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Entradas por Método
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.entries(porFormaPagamento).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma entrada no período</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(porFormaPagamento).map(([forma, valor]) => (
                <div key={forma} className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {formasPagamentoIcons[forma] || <CreditCard className="h-4 w-4 flex-shrink-0" />}
                    <span className="text-sm text-muted-foreground truncate">{forma}</span>
                  </div>
                  <span className="font-medium text-sm text-foreground whitespace-nowrap flex-shrink-0">
                    {valoresVisiveis ? formatCurrency(valor) : maskedValue}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
