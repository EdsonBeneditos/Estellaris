import { useState, useEffect } from "react";
import {
  Building2,
  UserPlus,
  Plus,
  Shield,
  Crown,
  Briefcase,
  User,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Settings2,
  Sparkles,
  Medal,
  Award,
  Trophy,
  FileText,
  Copy,
  KeyRound,
  RefreshCw,
} from "lucide-react";
import { GestaoFiscal } from "@/components/super-admin/GestaoFiscal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAllOrganizations,
  useCreateOrganization,
  useInviteUser,
  useCreateUser,
} from "@/hooks/useSuperAdmin";
import { useSimulation } from "@/contexts/SimulationContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { AVAILABLE_MODULES, MODULE_CONFIG, DEFAULT_MODULES, PLAN_TEMPLATES, ModuleKey, PlanType } from "@/lib/modules";

export default function SuperAdmin() {
  const { data: organizations = [], isLoading } = useAllOrganizations();
  const createOrg = useCreateOrganization();
  const inviteUser = useInviteUser();
  const createUser = useCreateUser();
  const { startSimulation } = useSimulation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Create Org State
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgCnpj, setNewOrgCnpj] = useState("");
  const [newOrgPlano, setNewOrgPlano] = useState<"Basico" | "Pro" | "Enterprise">("Basico");
  const [newOrgModules, setNewOrgModules] = useState<string[]>([...DEFAULT_MODULES]);
  const [selectedPlanTemplate, setSelectedPlanTemplate] = useState<PlanType | "custom">("Bronze");
  
  // Responsible person fields
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelEmail, setResponsavelEmail] = useState("");
  const [responsavelSenha, setResponsavelSenha] = useState("");
  const [showResponsavelSenha, setShowResponsavelSenha] = useState(false);

  // Credentials shown in the success overlay after org+user creation
  const [orgCreatedCredentials, setOrgCreatedCredentials] = useState<{
    orgNome: string;
    email: string;
    password: string;
  } | null>(null);

  // Edit Org State
  const [editingOrg, setEditingOrg] = useState<{
    id: string;
    nome: string;
    modules_enabled: string[] | null;
  } | null>(null);
  const [editModules, setEditModules] = useState<string[]>([]);
  const [editPlanTemplate, setEditPlanTemplate] = useState<PlanType | "custom">("custom");
  const [isSavingModules, setIsSavingModules] = useState(false);

  // Create User State
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteSenha, setInviteSenha] = useState("");
  const [inviteOrgId, setInviteOrgId] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "gerente" | "vendedor">("vendedor");
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    nome: string;
    orgNome: string;
    role: string;
  } | null>(null);

  // Success animation state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Apply plan template when selected
  useEffect(() => {
    if (selectedPlanTemplate !== "custom") {
      setNewOrgModules([...PLAN_TEMPLATES[selectedPlanTemplate]]);
    }
  }, [selectedPlanTemplate]);

  // Apply edit plan template when selected
  useEffect(() => {
    if (editPlanTemplate !== "custom") {
      setEditModules([...PLAN_TEMPLATES[editPlanTemplate]]);
    }
  }, [editPlanTemplate]);

  const generatePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let pwd = "";
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResponsavelSenha(pwd);
    setShowResponsavelSenha(true);
  };

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      toast.error("Nome da organização é obrigatório");
      return;
    }

    // If admin fields are provided, validate them
    if (responsavelEmail || responsavelNome || responsavelSenha) {
      if (!responsavelEmail.trim() || !responsavelNome.trim() || !responsavelSenha.trim()) {
        toast.error("Preencha nome, e-mail e senha do responsável ou deixe todos em branco");
        return;
      }
      if (!responsavelEmail.includes("@")) {
        toast.error("E-mail do responsável inválido");
        return;
      }
      if (responsavelSenha.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres");
        return;
      }
    }

    const hasAdmin = responsavelEmail.trim() && responsavelNome.trim() && responsavelSenha.trim();

    try {
      // Step 1: create the organization (Edge Function, no email invite)
      const result = await createOrg.mutateAsync({
        nome: newOrgName,
        cnpj: newOrgCnpj || undefined,
        plano: newOrgPlano,
        modules_enabled: newOrgModules,
        // Don't pass responsavel_email so the old Edge Function won't try to invite via email
      });

      const newOrgId: string = result.organization?.id;

      // Step 2: if admin credentials were provided, create the admin user
      if (hasAdmin && newOrgId) {
        try {
          await createUser.mutateAsync({
            email: responsavelEmail.trim(),
            password: responsavelSenha,
            nome: responsavelNome.trim(),
            organization_id: newOrgId,
            role: "admin",
          });

          // Show credentials in success overlay
          setOrgCreatedCredentials({
            orgNome: newOrgName,
            email: responsavelEmail.trim(),
            password: responsavelSenha,
          });
        } catch (userError: any) {
          // Rollback: delete the org we just created
          await supabase.from("organizations").delete().eq("id", newOrgId);
          queryClient.invalidateQueries({ queryKey: ["all-organizations"] });
          toast.error("Erro ao criar usuário admin — organização removida. Tente novamente.", {
            description: userError.message,
          });
          return;
        }
      }

      // Show success animation
      setSuccessMessage(result.message || `Organização "${newOrgName}" criada com sucesso!`);
      setShowSuccess(true);

      // Reset form
      setIsCreateOrgOpen(false);
      setNewOrgName("");
      setNewOrgCnpj("");
      setNewOrgPlano("Basico");
      setNewOrgModules([...DEFAULT_MODULES]);
      setSelectedPlanTemplate("Bronze");
      setResponsavelNome("");
      setResponsavelEmail("");
      setResponsavelSenha("");
      setShowResponsavelSenha(false);

      // Hide success animation after 8s (longer so admin can read credentials)
      setTimeout(() => setShowSuccess(false), 8000);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar organização");
    }
  };

  const handleCreateUser = async () => {
    if (!inviteEmail.trim() || !inviteNome.trim() || !inviteSenha.trim() || !inviteOrgId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (inviteSenha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      const result = await createUser.mutateAsync({
        email: inviteEmail.trim(),
        password: inviteSenha,
        nome: inviteNome.trim(),
        organization_id: inviteOrgId,
        role: inviteRole,
      });

      const orgNome = organizations.find((o) => o.id === inviteOrgId)?.nome || inviteOrgId;

      setCreatedCredentials({
        email: inviteEmail.trim(),
        password: inviteSenha,
        nome: inviteNome.trim(),
        orgNome,
        role: inviteRole,
      });

      setInviteEmail("");
      setInviteNome("");
      setInviteSenha("");
      setInviteOrgId("");
      setInviteRole("vendedor");

      toast.success(result.message || "Usuário criado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar usuário");
    }
  };

  const handleCopyCredentials = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handleSimulateAccess = (org: { id: string; nome: string }) => {
    startSimulation({ id: org.id, nome: org.nome });
    toast.success(`Simulando acesso: ${org.nome}`);
    navigate("/");
  };

  const handleEditModules = (org: { id: string; nome: string; modules_enabled: string[] | null }) => {
    setEditingOrg(org);
    setEditModules(org.modules_enabled || [...DEFAULT_MODULES]);
    setEditPlanTemplate("custom");
  };

  const handleSaveModules = async () => {
    if (!editingOrg) return;
    
    setIsSavingModules(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ modules_enabled: editModules })
        .eq("id", editingOrg.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["all-organizations"] });
      toast.success("Módulos atualizados com sucesso!");
      setEditingOrg(null);
    } catch (error: any) {
      toast.error("Erro ao salvar módulos", { description: error.message });
    } finally {
      setIsSavingModules(false);
    }
  };

  const toggleModule = (moduleKey: string, isEdit: boolean = false) => {
    if (isEdit) {
      setEditPlanTemplate("custom");
      setEditModules((prev) =>
        prev.includes(moduleKey)
          ? prev.filter((m) => m !== moduleKey)
          : [...prev, moduleKey]
      );
    } else {
      setSelectedPlanTemplate("custom");
      setNewOrgModules((prev) =>
        prev.includes(moduleKey)
          ? prev.filter((m) => m !== moduleKey)
          : [...prev, moduleKey]
      );
    }
  };

  const planoColors = {
    Basico: "bg-zinc-500",
    Pro: "bg-blue-500",
    Enterprise: "bg-amber-500",
  };

  const planTemplateIcons = {
    Bronze: <Medal className="h-4 w-4 text-amber-700" />,
    Prata: <Award className="h-4 w-4 text-slate-400" />,
    Ouro: <Trophy className="h-4 w-4 text-yellow-500" />,
  };

  // Agrupar módulos por categoria
  const modulesByCategory = AVAILABLE_MODULES.reduce((acc, moduleKey) => {
    const config = MODULE_CONFIG[moduleKey];
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(moduleKey);
    return acc;
  }, {} as Record<string, ModuleKey[]>);

  const categoryLabels: Record<string, string> = {
    core: "Principal",
    comercial: "Comercial",
    operacional: "Operacional",
    financeiro: "Financeiro",
    analytics: "Relatórios",
    admin: "Administração",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Success Overlay Animation */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <Sparkles className="h-16 w-16 text-white/30" />
                </div>
                <Check className="h-16 w-16" />
              </div>
              <h3 className="text-2xl font-bold">Organização Criada!</h3>
              <p className="text-emerald-100">{successMessage}</p>
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                <Badge className="bg-white/20 text-white border-white/30">
                  Centros de Custo ✓
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30">
                  Módulos ✓
                </Badge>
                {orgCreatedCredentials && (
                  <Badge className="bg-white/20 text-white border-white/30">
                    Admin criado ✓
                  </Badge>
                )}
              </div>

              {/* Credentials block */}
              {orgCreatedCredentials && (
                <div className="w-full mt-2 rounded-xl bg-white/10 border border-white/20 p-4 text-left space-y-2 font-mono text-sm">
                  <p className="text-white/70 text-xs uppercase tracking-wide font-sans font-semibold mb-3">
                    Credenciais de acesso — repasse ao cliente
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/70 shrink-0 font-sans text-xs">E-mail</span>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="text-white font-semibold truncate">{orgCreatedCredentials.email}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(orgCreatedCredentials.email); toast.success("Copiado!"); }}
                        className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
                      >
                        <Copy className="h-3 w-3 text-white/80" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/70 shrink-0 font-sans text-xs">Senha</span>
                    <div className="flex items-center gap-1 flex-1 justify-end">
                      <span className="text-white font-bold tracking-widest">{orgCreatedCredentials.password}</span>
                      <button
                        onClick={() => { navigator.clipboard.writeText(orgCreatedCredentials.password); toast.success("Copiado!"); }}
                        className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
                      >
                        <Copy className="h-3 w-3 text-white/80" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => { setShowSuccess(false); setOrgCreatedCredentials(null); }}
                className="mt-2 text-white/70 hover:text-white text-sm underline"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
              Central Super Admin
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Gerencie organizações, módulos e usuários do sistema
          </p>
        </div>
      </div>

      {/* Warning Alert */}
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <AlertTitle className="text-amber-700 dark:text-amber-400">
          Área Restrita
        </AlertTitle>
        <AlertDescription className="text-amber-600 dark:text-amber-300">
          Você está acessando a central de Super Administrador. Tenha cuidado ao
          realizar alterações, pois elas afetam todas as organizações do sistema.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="organizations" className="space-y-6">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900">
          <TabsTrigger value="organizations" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organizações
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2">
            <FileText className="h-4 w-4" />
            Gestão Fiscal
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Convidar Usuários
          </TabsTrigger>
        </TabsList>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Organizações ({organizations.length})
            </h2>
            <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Organização
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Criar Nova Organização
                  </DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar uma nova empresa. O administrador poderá acessar o sistema imediatamente com as credenciais definidas abaixo — nenhum e-mail é enviado.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  {/* Dados da Empresa */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Dados da Empresa
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Nome da Empresa *</Label>
                        <Input
                          id="orgName"
                          placeholder="Ex: Empresa ABC Ltda"
                          value={newOrgName}
                          onChange={(e) => setNewOrgName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgCnpj">CNPJ</Label>
                        <Input
                          id="orgCnpj"
                          placeholder="00.000.000/0001-00"
                          value={newOrgCnpj}
                          onChange={(e) => setNewOrgCnpj(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados do Responsável */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Responsável / Administrador <span className="normal-case font-normal">(opcional)</span>
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="responsavelNome">Nome do Responsável</Label>
                        <Input
                          id="responsavelNome"
                          placeholder="Ex: João Silva"
                          value={responsavelNome}
                          onChange={(e) => setResponsavelNome(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="responsavelEmail">E-mail do Responsável</Label>
                        <Input
                          id="responsavelEmail"
                          type="email"
                          placeholder="admin@empresa.com"
                          value={responsavelEmail}
                          onChange={(e) => setResponsavelEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="responsavelSenha" className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4" />
                        Senha Temporária
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="responsavelSenha"
                            type={showResponsavelSenha ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            value={responsavelSenha}
                            onChange={(e) => setResponsavelSenha(e.target.value)}
                            className="font-mono pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowResponsavelSenha((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showResponsavelSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generatePassword}
                          className="gap-1.5 shrink-0"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Gerar
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Preencha nome, e-mail e senha para criar o admin junto com a organização.
                      </p>
                    </div>
                  </div>

                  {/* Plano e Template */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                      Plano e Módulos
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="orgPlano">Plano Comercial</Label>
                        <Select value={newOrgPlano} onValueChange={(v) => setNewOrgPlano(v as any)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Basico">Básico</SelectItem>
                            <SelectItem value="Pro">Pro</SelectItem>
                            <SelectItem value="Enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Template de Módulos</Label>
                        <Select 
                          value={selectedPlanTemplate} 
                          onValueChange={(v) => setSelectedPlanTemplate(v as PlanType | "custom")}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bronze">
                              <div className="flex items-center gap-2">
                                <Medal className="h-4 w-4 text-amber-700" />
                                Bronze (4 módulos)
                              </div>
                            </SelectItem>
                            <SelectItem value="Prata">
                              <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-slate-400" />
                                Prata (7 módulos)
                              </div>
                            </SelectItem>
                            <SelectItem value="Ouro">
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-500" />
                                Ouro (Todos)
                              </div>
                            </SelectItem>
                            <SelectItem value="custom">
                              <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                Personalizado
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Template Preview */}
                    {selectedPlanTemplate !== "custom" && (
                      <Alert className="bg-muted/50 border-primary/20">
                        <div className="flex items-center gap-2">
                          {planTemplateIcons[selectedPlanTemplate]}
                          <AlertDescription className="text-sm">
                            <strong>Plano {selectedPlanTemplate}:</strong>{" "}
                            {PLAN_TEMPLATES[selectedPlanTemplate].map(m => MODULE_CONFIG[m].label).join(", ")}
                          </AlertDescription>
                        </div>
                      </Alert>
                    )}

                    {/* Módulos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
                      {Object.entries(modulesByCategory).map(([category, modules]) => (
                        <div key={category} className="space-y-2">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            {categoryLabels[category]}
                          </p>
                          {modules.map((moduleKey) => {
                            const config = MODULE_CONFIG[moduleKey];
                            return (
                              <div
                                key={moduleKey}
                                className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  id={`new-${moduleKey}`}
                                  checked={newOrgModules.includes(moduleKey)}
                                  onCheckedChange={() => toggleModule(moduleKey, false)}
                                />
                                <label
                                  htmlFor={`new-${moduleKey}`}
                                  className="text-sm font-medium cursor-pointer flex-1"
                                >
                                  {config.label}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    {newOrgModules.length} módulos selecionados
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsCreateOrgOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateOrg} disabled={createOrg.isPending || createUser.isPending} className="gap-2">
                      {createOrg.isPending || createUser.isPending ? (
                        "Criando..."
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Criar Organização
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30 hover:scale-[1.01]"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-base text-zinc-950 dark:text-zinc-50">
                        {org.nome}
                      </CardTitle>
                    </div>
                    <Badge
                      className={`${planoColors[org.plano as keyof typeof planoColors]} text-white`}
                    >
                      {org.plano}
                    </Badge>
                  </div>
                  {org.cnpj && (
                    <CardDescription className="text-xs">
                      CNPJ: {org.cnpj}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={org.ativo ? "outline" : "destructive"} className="text-xs">
                      {org.ativo ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> Ativo
                        </span>
                      ) : (
                        "Inativo"
                      )}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {(org.modules_enabled || DEFAULT_MODULES).length} módulos
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleEditModules(org)}
                    >
                      <Settings2 className="h-4 w-4" />
                      Módulos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2 border-amber-500/50 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                      onClick={() => handleSimulateAccess(org)}
                    >
                      <Eye className="h-4 w-4" />
                      Simular
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {organizations.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma organização cadastrada
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fiscal Tab */}
        <TabsContent value="fiscal">
          <GestaoFiscal organizations={organizations as any} />
        </TabsContent>

        {/* Create Users Tab */}
        <TabsContent value="users" className="space-y-4">
          {/* Credentials card shown after successful creation */}
          {createdCredentials && (
            <Card className="border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-base">
                  <Check className="h-5 w-5" />
                  Usuário criado! Anote as credenciais de acesso
                </CardTitle>
                <CardDescription className="text-emerald-600 dark:text-emerald-500">
                  Passe estas informações ao cliente via WhatsApp ou outro canal seguro.
                  Após fechar este card você não verá a senha novamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 p-4 space-y-3 font-mono text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Nome:</span>
                    <span className="font-semibold flex-1 text-right">{createdCredentials.nome}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Organização:</span>
                    <span className="font-semibold flex-1 text-right">{createdCredentials.orgNome}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Cargo:</span>
                    <span className="font-semibold flex-1 text-right capitalize">{createdCredentials.role}</span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">E-mail:</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="font-semibold">{createdCredentials.email}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyCredentials(createdCredentials.email)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Senha:</span>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <span className="font-semibold tracking-widest">{createdCredentials.password}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyCredentials(createdCredentials.password)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreatedCredentials(null)}
                  >
                    Fechar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50">
                <UserPlus className="h-5 w-5" />
                Criar Novo Usuário
              </CardTitle>
              <CardDescription>
                Cria o usuário diretamente com e-mail e senha — sem envio de e-mail. O acesso fica disponível imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invEmail">E-mail *</Label>
                  <Input
                    id="invEmail"
                    type="email"
                    placeholder="usuario@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invNome">Nome completo *</Label>
                  <Input
                    id="invNome"
                    placeholder="Ex: João Silva"
                    value={inviteNome}
                    onChange={(e) => setInviteNome(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invSenha" className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Senha temporária *
                </Label>
                <Input
                  id="invSenha"
                  type="text"
                  placeholder="Mínimo 6 caracteres"
                  value={inviteSenha}
                  onChange={(e) => setInviteSenha(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Crie uma senha inicial. O usuário poderá alterá-la após o primeiro acesso.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="invOrg">Organização *</Label>
                  <Select value={inviteOrgId} onValueChange={setInviteOrgId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma organização" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invRole">Cargo</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-emerald-500" />
                          Vendedor
                        </div>
                      </SelectItem>
                      <SelectItem value="gerente">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-blue-500" />
                          Gerente
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          Administrador
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateUser}
                  disabled={createUser.isPending || !inviteEmail || !inviteNome || !inviteSenha || !inviteOrgId}
                  className="gap-2"
                >
                  {createUser.isPending ? (
                    "Criando usuário..."
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Criar Usuário
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-amber-500/30 bg-amber-500/10">
            <Shield className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Nenhum e-mail é enviado. O usuário é criado com acesso imediato usando as credenciais
              informadas. Anote a senha antes de fechar o card de confirmação.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {/* Modal de Edição de Módulos */}
      <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Gerenciar Módulos - {editingOrg?.nome}
            </DialogTitle>
            <DialogDescription>
              Selecione os módulos que estarão disponíveis para esta organização.
            </DialogDescription>
          </DialogHeader>
          
          {/* Plan Template Selector for Edit */}
          <div className="space-y-2 py-2">
            <Label>Aplicar Template de Plano</Label>
            <Select 
              value={editPlanTemplate} 
              onValueChange={(v) => setEditPlanTemplate(v as PlanType | "custom")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Bronze">
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-amber-700" />
                    Bronze (4 módulos)
                  </div>
                </SelectItem>
                <SelectItem value="Prata">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-slate-400" />
                    Prata (7 módulos)
                  </div>
                </SelectItem>
                <SelectItem value="Ouro">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Ouro (Todos)
                  </div>
                </SelectItem>
                <SelectItem value="custom">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Personalizado
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {Object.entries(modulesByCategory).map(([category, modules]) => (
              <div key={category} className="space-y-2 p-3 border rounded-lg bg-muted/20">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b pb-1">
                  {categoryLabels[category]}
                </p>
                {modules.map((moduleKey) => {
                  const config = MODULE_CONFIG[moduleKey];
                  return (
                    <div
                      key={moduleKey}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`edit-${moduleKey}`}
                        checked={editModules.includes(moduleKey)}
                        onCheckedChange={() => toggleModule(moduleKey, true)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`edit-${moduleKey}`}
                          className="text-sm font-medium cursor-pointer block"
                        >
                          {config.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {editModules.length} módulos selecionados
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingOrg(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveModules} disabled={isSavingModules}>
                {isSavingModules ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
