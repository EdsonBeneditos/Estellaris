import { Badge } from "@/components/ui/badge";
import { format, isToday, isPast, isFuture, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReturnBadgeProps {
  date: string | null;
}

export function ReturnBadge({ date }: ReturnBadgeProps) {
  if (!date) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const parsedDate = parseISO(date);
  const formattedDate = format(parsedDate, "dd/MM/yyyy", { locale: ptBR });

  if (isPast(parsedDate) && !isToday(parsedDate)) {
    return (
      <Badge variant="destructive" className="font-medium">
        {formattedDate}
      </Badge>
    );
  }

  if (isToday(parsedDate)) {
    return (
      <Badge className="bg-warning text-warning-foreground hover:bg-warning/90 font-medium">
        {formattedDate}
      </Badge>
    );
  }

  if (isFuture(parsedDate)) {
    return (
      <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
        {formattedDate}
      </Badge>
    );
  }

  return <span className="text-sm">{formattedDate}</span>;
}
