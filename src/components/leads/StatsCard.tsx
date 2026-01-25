import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "danger";
}

export function StatsCard({ title, value, icon: Icon, description, variant = "default" }: StatsCardProps) {
  const isDanger = variant === "danger";
  
  return (
    <Card className={cn(
      "relative bg-card/80 backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 hover:z-50 cursor-pointer",
      isDanger 
        ? "border-destructive/30 bg-destructive/5" 
        : "border-border/50"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={cn(
              "text-sm font-semibold tracking-tight",
              isDanger ? "text-destructive" : "text-muted-foreground"
            )}>{title}</p>
            <p className={cn(
              "text-3xl font-bold tracking-tight",
              isDanger ? "text-destructive" : "text-foreground"
            )}>{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground/80">{description}</p>
            )}
          </div>
          <div className={cn(
            "h-14 w-14 rounded-xl flex items-center justify-center transition-transform hover:scale-105",
            isDanger 
              ? "bg-destructive/10" 
              : "bg-gradient-to-br from-primary/10 to-primary/5"
          )}>
            <Icon className={cn(
              "h-7 w-7",
              isDanger ? "text-destructive" : "text-primary"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
