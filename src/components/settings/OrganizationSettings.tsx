import { useState, useEffect } from "react";
import { Save, Clock, Calendar, Palette, Globe, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCurrentOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/i18n/translations";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DAYS = [
  { key: "seg", label: "Segunda-feira" },
  { key: "ter", label: "Terça-feira" },
  { key: "qua", label: "Quarta-feira" },
  { key: "qui", label: "Quinta-feira" },
  { key: "sex", label: "Sexta-feira" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
];

export function OrganizationSettings() {
  const { data: organization, isLoading } = useCurrentOrganization();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const queryClient = useQueryClient();

  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFim, setHoraFim] = useState("18:00");
  const [diasAcesso, setDiasAcesso] = useState<string[]>(["seg", "ter", "qua", "qui", "sex"]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      const org = organization as any;
      if (org.hora_inicio_acesso) {
        setHoraInicio(org.hora_inicio_acesso.slice(0, 5));
      }
      if (org.hora_fim_acesso) {
        setHoraFim(org.hora_fim_acesso.slice(0, 5));
      }
      if (org.dias_acesso && Array.isArray(org.dias_acesso)) {
        setDiasAcesso(org.dias_acesso);
      }
    }
  }, [organization]);

  const toggleDay = (day: string) => {
    setDiasAcesso((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const handleSaveAccessControl = async () => {
    if (!organization) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          hora_inicio_acesso: horaInicio + ":00",
          hora_fim_acesso: horaFim + ":00",
          dias_acesso: diasAcesso,
        })
        .eq("id", organization.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["current-organization"] });
      toast.success("Configurações de acesso salvas com sucesso!");
    } catch (error) {
      console.error("Error saving access control:", error);
      toast.error("Erro ao salvar configurações de acesso");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Theme and Language */}
      <Card className="bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="h-5 w-5 text-purple-600" />
            {t.settings.theme} & {t.settings.language}
          </CardTitle>
          <CardDescription>
            Personalize a aparência e idioma do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Theme Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t.settings.theme}
              </Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">{t.settings.themeDefault}</SelectItem>
                  <SelectItem value="light">{t.settings.themeLight}</SelectItem>
                  <SelectItem value="dark">{t.settings.themeDark}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t.settings.language}
              </Label>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="es-ES">Español (España)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card className="bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-amber-600" />
            {t.settings.accessControl}
          </CardTitle>
          <CardDescription>
            Defina horários e dias de acesso para usuários não-administradores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t.settings.startTime}
              </Label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t.settings.endTime}
              </Label>
              <Input
                type="time"
                value={horaFim}
                onChange={(e) => setHoraFim(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>

          <Separator />

          {/* Days of Week */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t.settings.allowedDays}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              {DAYS.map((day) => (
                <div
                  key={day.key}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                    diasAcesso.includes(day.key)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleDay(day.key)}
                >
                  <Checkbox
                    checked={diasAcesso.includes(day.key)}
                    onCheckedChange={() => toggleDay(day.key)}
                  />
                  <span className="text-sm font-medium">{day.label.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveAccessControl} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : t.common.save}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
