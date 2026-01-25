import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Wallet, CreditCard, Banknote, Smartphone, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TotalizadoresCardProps {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  porFormaPagamento: Record<string, number>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formasPagamentoIcons: Record<string, React.ReactNode> = {
  Pix: <Smartphone className="h-4 w-4" />,
  "Cartão Débito": <CreditCard className="h-4 w-4" />,
  "Cartão Crédito": <CreditCard className="h-4 w-4" />,
  Dinheiro: <Banknote className="h-4 w-4" />,
  Boleto: <Building2 className="h-4 w-4" />,
  Transferência: <Building2 className="h-4 w-4" />,
};

export function TotalizadoresCard({
  totalEntradas,
  totalSaidas,
  saldoLiquido,
  porFormaPagamento,
}: TotalizadoresCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 p-1 -m-1">
      {/* Total Entradas */}
      <Card className="relative border-border/50 bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Entradas
          </CardTitle>
          <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(totalEntradas)}
          </div>
        </CardContent>
      </Card>

      {/* Total Saídas */}
      <Card className="relative border-border/50 bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Saídas
          </CardTitle>
          <ArrowDownCircle className="h-5 w-5 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(totalSaidas)}
          </div>
        </CardContent>
      </Card>

      {/* Saldo Líquido */}
      <Card className="relative border-border/50 bg-card transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Saldo Líquido
          </CardTitle>
          <Wallet className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold",
              saldoLiquido >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {formatCurrency(saldoLiquido)}
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Forma de Pagamento */}
      <Card className="relative border-border/50 bg-card md:col-span-3 lg:col-span-1 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Entradas por Método
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {Object.entries(porFormaPagamento).length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhuma entrada no período</p>
          ) : (
            Object.entries(porFormaPagamento).map(([forma, valor]) => (
              <div key={forma} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  {formasPagamentoIcons[forma] || <CreditCard className="h-4 w-4" />}
                  <span>{forma}</span>
                </div>
                <span className="font-medium text-foreground">
                  {formatCurrency(valor)}
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
