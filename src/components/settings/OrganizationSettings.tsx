import { useState, useEffect, useRef } from "react";
import { Save, Clock, Calendar, Palette, Globe, Shield, Upload, Image, Loader2, UserCircle, Users, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCurrentOrganization, useUpdateOrganization, useCurrentProfile, useOrganizationMembers } from "@/hooks/useOrganization";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePermissions, MENU_KEYS } from "@/hooks/usePermissions";
import { Language } from "@/lib/i18n/translations";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MENU_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  futuros_leads: "Futuros Leads",
  clientes: "Clientes",
  colaboradores: "Colaboradores",
  estoque: "Estoque",
  orcamentos: "Orçamentos",
  notas_fiscais: "Notas Fiscais",
  financeiro: "Financeiro / Caixa",
  relatorios: "Relatórios",
  equipe: "Equipe",
  configuracoes: "Configurações",
};

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
  const { data: currentProfile } = useCurrentProfile();
  const { data: orgMembers = [] } = useOrganizationMembers();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [savingPermissions, setSavingPermissions] = useState<string | null>(null);

  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFim, setHoraFim] = useState("18:00");
  const [diasAcesso, setDiasAcesso] = useState<string[]>(["seg", "ter", "qua", "qui", "sex"]);
  const [orcamentoCabecalho, setOrcamentoCabecalho] = useState("");
  const [orcamentoRodape, setOrcamentoRodape] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingLetterhead, setIsSavingLetterhead] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [idNome, setIdNome] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
      setOrcamentoCabecalho(org.orcamento_cabecalho || "");
      setOrcamentoRodape(org.orcamento_rodape || "");
      setLogoUrl(org.orcamento_logo_url || null);
    }
  }, [organization]);

  useEffect(() => {
    if (currentProfile) {
      setIdNome(currentProfile.id_nome || "");
    }
  }, [currentProfile]);

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

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Apenas arquivos de imagem são aceitos.");
      return;
    }

    setIsUploadingLogo(true);
    try {
      const filePath = `logos/${organization.id}/logo.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("org-logos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ orcamento_logo_url: publicUrl } as any)
        .eq("id", organization.id);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
      await queryClient.invalidateQueries({ queryKey: ["current-organization"] });
      toast.success("Logo enviado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar logo", { description: error.message });
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSaveLetterhead = async () => {
    if (!organization) return;
    setIsSavingLetterhead(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          orcamento_cabecalho: orcamentoCabecalho || null,
          orcamento_rodape: orcamentoRodape || null,
        } as any)
        .eq("id", organization.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["current-organization"] });
      toast.success("Papel timbrado salvo com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setIsSavingLetterhead(false);
    }
  };
  const handleToggleMenuPermission = async (userId: string, menuKey: string, currentPermissions: string[] | null) => {
    setSavingPermissions(userId);
    try {
      let updated: string[];
      if (currentPermissions === null) {
        // null = sem restrições → ao desmarcar um menu, criamos a lista com todos exceto o desmarcado
        updated = MENU_KEYS.filter((k) => k !== menuKey);
      } else if (currentPermissions.includes(menuKey)) {
        updated = currentPermissions.filter((k) => k !== menuKey);
      } else {
        updated = [...currentPermissions, menuKey];
      }
      const { error } = await supabase
        .from("profiles")
        .update({ menu_permissions: updated } as any)
        .eq("id", userId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      toast.success("Permissão atualizada!");
    } catch (error: any) {
      toast.error("Erro ao atualizar permissão", { description: error.message });
    } finally {
      setSavingPermissions(null);
    }
  };

  const handleGrantAllMenus = async (userId: string) => {
    setSavingPermissions(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ menu_permissions: null } as any)
        .eq("id", userId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      toast.success("Acesso total liberado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar permissões", { description: error.message });
    } finally {
      setSavingPermissions(null);
    }
  };

  const handleRevokeAllMenus = async (userId: string) => {
    setSavingPermissions(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ menu_permissions: [] } as any)
        .eq("id", userId);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      toast.success("Todos os acessos revogados!");
    } catch (error: any) {
      toast.error("Erro ao atualizar permissões", { description: error.message });
    } finally {
      setSavingPermissions(null);
    }
  };

  const handleSaveProfile = async () => {
    if (!currentProfile) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ id_nome: idNome.trim() || null })
        .eq("id", currentProfile.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["current-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      toast.success("Nome de exibição salvo com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar", { description: error.message });
    } finally {
      setIsSavingProfile(false);
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
      {/* Perfil do Usuário - ID Nome */}
      <Card className="bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <UserCircle className="h-5 w-5 text-blue-600" />
            Meu Perfil
          </CardTitle>
          <CardDescription>
            Configure seu nome de exibição (ID Nome) — será usado nas tabelas de movimentações e auditorias
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome de Exibição (ID Nome)</Label>
              <Input
                placeholder="Ex: João Silva"
                value={idNome}
                onChange={(e) => setIdNome(e.target.value)}
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Este nome aparecerá nas colunas 'Quem Fez' e 'Autorizou' das movimentações.
              </p>
            </div>
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input value={currentProfile?.email || ""} disabled className="bg-muted" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="gap-2">
              {isSavingProfile ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="h-4 w-4" /> Salvar Perfil</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark")}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="light">Claro</SelectItem>
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

      {/* Permissões de Menu por Usuário — apenas admin */}
      {isAdmin && (
        <Card className="bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="h-5 w-5 text-red-600" />
              Permissões de Acesso ao Menu
            </CardTitle>
            <CardDescription>
              Defina quais menus cada colaborador pode visualizar. Administradores sempre têm acesso total.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orgMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum colaborador encontrado.</p>
            ) : (
              orgMembers
                .filter((m) => m.id !== currentProfile?.id && !m.is_super_admin)
                .filter((m) => !m.roles.some((r) => r.role === "admin"))
                .map((member) => {
                  const perms: string[] | null = (member as any).menu_permissions ?? null;
                  const isLoading = savingPermissions === member.id;
                  return (
                    <div key={member.id} className="rounded-lg border border-border bg-background p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{member.id_nome || member.nome}</span>
                          <span className="text-xs text-muted-foreground">({member.email})</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleGrantAllMenus(member.id)}
                            className="text-xs h-7"
                          >
                            Liberar tudo
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isLoading}
                            onClick={() => handleRevokeAllMenus(member.id)}
                            className="text-xs h-7 text-destructive hover:text-destructive"
                          >
                            Revogar tudo
                          </Button>
                        </div>
                      </div>
                      {perms === null && (
                        <Badge variant="secondary" className="text-xs">Acesso total (sem restrições)</Badge>
                      )}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {MENU_KEYS.map((menuKey) => {
                          const hasAccess = perms === null || perms.includes(menuKey);
                          return (
                            <label
                              key={menuKey}
                              className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors select-none ${
                                hasAccess
                                  ? "bg-primary/10 border-primary/30 text-primary"
                                  : "bg-muted/30 border-border text-muted-foreground"
                              } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                            >
                              <Checkbox
                                checked={hasAccess}
                                disabled={isLoading}
                                onCheckedChange={() => handleToggleMenuPermission(member.id, menuKey, perms)}
                              />
                              <span className="text-xs font-medium truncate">{MENU_LABELS[menuKey]}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
            )}
          </CardContent>
        </Card>
      )}

      {/* Papel Timbrado / Orçamentos */}
      <Card className="bg-gradient-to-br from-slate-50 to-zinc-100 dark:from-zinc-900 dark:to-slate-900 border-slate-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Image className="h-5 w-5 text-blue-600" />
            Papel Timbrado & Orçamentos
          </CardTitle>
          <CardDescription>
            Personalize o logo, cabeçalho e rodapé dos seus orçamentos e documentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-3">
            <Label>Logo da Empresa</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 w-auto rounded border border-border object-contain bg-white p-1" />
              ) : (
                <div className="h-16 w-16 rounded border border-dashed border-border flex items-center justify-center bg-muted">
                  <Image className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadLogo}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="gap-2"
                >
                  {isUploadingLogo ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Enviar Logo</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG. Recomendado 200x200px.</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Header & Footer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Texto do Cabeçalho</Label>
              <Textarea
                placeholder="Ex: Soluções em Tratamento de Água - Desde 2010"
                value={orcamentoCabecalho}
                onChange={(e) => setOrcamentoCabecalho(e.target.value)}
                className="bg-background resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Aparece no topo dos orçamentos, abaixo do logo.</p>
            </div>
            <div className="space-y-2">
              <Label>Texto do Rodapé</Label>
              <Textarea
                placeholder="Ex: contato@empresa.com.br | (11) 0000-0000"
                value={orcamentoRodape}
                onChange={(e) => setOrcamentoRodape(e.target.value)}
                className="bg-background resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Aparece no rodapé dos orçamentos.</p>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveLetterhead} disabled={isSavingLetterhead} className="gap-2">
              {isSavingLetterhead ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save className="h-4 w-4" /> Salvar Papel Timbrado</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
