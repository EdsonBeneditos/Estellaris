import { Badge } from "@/components/ui/badge";
import { format, isToday, isPast, isFuture, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReturnBadgeProps {
  date: string | null;
  status?: string | null;
}

export function ReturnBadge({ date, status }: ReturnBadgeProps) {
  if (!date) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const parsedDate = parseISO(date);
  const formattedDate = format(parsedDate, "dd/MM/yyyy", { locale: ptBR });

  if (isPast(parsedDate) && !isToday(parsedDate)) {
    if (status === "Convertido") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-300 hover:bg-emerald-100/80 font-medium dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700">
          {formattedDate}
        </Badge>
      );
    }
    return (
      <Badge variant="destructive" className="font-medium">
        {formattedDate}
      </Badge>
    );
  }

  if (isToday(parsedDate)) {
    return (
      <Badge className="bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-100/80 font-medium dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
        {formattedDate}
      </Badge>
    );
  }

  if (isFuture(parsedDate)) {
    const daysUntil = differenceInDays(parsedDate, new Date());
    if (daysUntil <= 7) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border border-amber-300 hover:bg-amber-100/80 font-medium dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700">
          {formattedDate}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="font-medium text-muted-foreground">
        {formattedDate}
      </Badge>
    );
  }

  return <span className="text-sm">{formattedDate}</span>;
}
