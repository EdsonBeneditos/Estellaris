import { ShieldX, Clock, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { AccessControlSettings } from "@/hooks/useAccessControl";

interface AccessBlockedProps {
  settings?: AccessControlSettings;
}

const DAY_LABELS: Record<string, Record<string, string>> = {
  "pt-BR": { seg: "Segunda", ter: "Terça", qua: "Quarta", qui: "Quinta", sex: "Sexta", sab: "Sábado", dom: "Domingo" },
  "en-US": { seg: "Monday", ter: "Tuesday", qua: "Wednesday", qui: "Thursday", sex: "Friday", sab: "Saturday", dom: "Sunday" },
  "es-ES": { seg: "Lunes", ter: "Martes", qua: "Miércoles", qui: "Jueves", sex: "Viernes", sab: "Sábado", dom: "Domingo" },
};

export default function AccessBlocked({ settings }: AccessBlockedProps) {
  const { t, language } = useLanguage();
  const { signOut } = useAuthContext();

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || "00:00";
  };

  const dayLabels = DAY_LABELS[language] || DAY_LABELS["pt-BR"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-zinc-200 dark:from-zinc-900 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl border-red-200 dark:border-red-900/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-4 rounded-full bg-red-100 dark:bg-red-900/30">
            <ShieldX className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-700 dark:text-red-400">
            {t.auth.accessBlocked}
          </CardTitle>
          <CardDescription className="text-lg font-medium text-slate-600 dark:text-zinc-400">
            {t.auth.outsideBusinessHours}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            {t.auth.accessBlockedMessage}
          </p>

          {settings && (
            <div className="space-y-4 p-4 rounded-lg bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-zinc-400">
                    {t.auth.allowedHours}
                  </p>
                  <p className="text-lg font-bold text-slate-800 dark:text-zinc-100">
                    {formatTime(settings.horaInicioAcesso)} - {formatTime(settings.horaFimAcesso)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 mb-2">
                    {t.auth.allowedDays}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {settings.diasAcesso.map((day) => (
                      <Badge key={day} variant="secondary" className="text-xs">
                        {dayLabels[day] || day}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            {t.auth.contactAdmin}
          </p>

          <Button
            onClick={() => signOut()}
            variant="outline"
            className="w-full gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t.auth.logout}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
