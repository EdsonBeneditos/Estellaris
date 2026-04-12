import { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Crown,
  Briefcase,
  User,
  Building2,
  AlertCircle,
  Clock,
  KeyRound,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useOrganizationMembers,
  useCurrentOrganization,
  useUpdateUserRole,
  useRemoveOrganizationMember,
  useIsOrgAdmin,
} from "@/hooks/useOrganization";
import { useCreateUser } from "@/hooks/useSuperAdmin";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const roleLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Administrador", icon: Crown, color: "bg-amber-500" },
  gerente: { label: "Gerente", icon: Briefcase, color: "bg-blue-500" },
  vendedor: { label: "Vendedor", icon: User, color: "bg-emerald-500" },
};

const DAYS_OPTIONS = [
  { value: "seg", label: "Seg" },
  { value: "ter", label: "Ter" },
  { value: "qua", label: "Qua" },
  { value: "qui", label: "Qui" },
  { value: "sex", label: "Sex" },
  { value: "sab", label: "Sáb" },
  { value: "dom", label: "Dom" },
];

export default function Equipe() {
  const { user } = useAuthContext();
  const { data: organization, isLoading: orgLoading } = useCurrentOrganization();
  const { data: members = [], isLoading: membersLoading } = useOrganizationMembers();
  const updateRole = useUpdateUserRole();
  const removeMember = useRemoveOrganizationMember();
  const isAdmin = useIsOrgAdmin();

  const createUser = useCreateUser();

  // Add member dialog state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberNome, setMemberNome] = useState("");
  const [memberSenha, setMemberSenha] = useState("");
  const [showMemberSenha, setShowMemberSenha] = useState(false);
  const [memberRole, setMemberRole] = useState<"gerente" | "vendedor">("vendedor");

  // Credentials shown after successful creation
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
    nome: string;
  } | null>(null);

  // Access control modal state
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessMember, setAccessMember] = useState<any>(null);
  const [accessDays, setAccessDays] = useState<string[]>([]);
  const [accessInicio, setAccessInicio] = useState("08:00");
  const [accessFim, setAccessFim] = useState("18:00");
  const [savingAccess, setSavingAccess] = useState(false);

  const handleRoleChange = async (userId: string, newRole: "admin" | "gerente" | "vendedor") => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      toast.success("Cargo atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar cargo");
    }
  };

  const handleRemoveMember = async (userId: string, memberName: string) => {
    try {
      await removeMember.mutateAsync(userId);
      toast.success(`${memberName} foi removido da equipe`);
    } catch (error) {
      toast.error("Erro ao remover membro");
    }
  };

  const handleCreateMember = async () => {
    if (!memberEmail.trim() || !memberNome.trim() || !memberSenha.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (memberSenha.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      // organization_id is omitted — the Edge Function will use the caller's own org
      await createUser.mutateAsync({
        email: memberEmail.trim(),
        password: memberSenha,
        nome: memberNome.trim(),
        role: memberRole,
      });

      setCreatedCredentials({
        email: memberEmail.trim(),
        password: memberSenha,
        nome: memberNome.trim(),
      });

      setIsAddOpen(false);
      setMemberEmail("");
      setMemberNome("");
      setMemberSenha("");
      setMemberRole("vendedor");

      toast.success("Membro criado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar membro");
    }
  };

  const handleCopyCredential = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const openAccessModal = (member: any) => {
    setAccessMember(member);
    setAccessDays(member.dias_acesso || ["seg", "ter", "qua", "qui", "sex"]);
    setAccessInicio(member.horario_inicio ? String(member.horario_inicio).slice(0, 5) : "08:00");
    setAccessFim(member.horario_fim ? String(member.horario_fim).slice(0, 5) : "18:00");
    setAccessModalOpen(true);
  };

  const handleSaveAccess = async () => {
    if (!accessMember) return;
    setSavingAccess(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          dias_acesso: accessDays,
          horario_inicio: accessInicio,
          horario_fim: accessFim,
        })
        .eq("id", accessMember.id);

      if (error) throw error;
      toast.success(`Acesso de ${accessMember.nome} atualizado!`);
      setAccessModalOpen(false);
    } catch (error: any) {
      toast.error("Erro ao salvar acesso", { description: error.message });
    } finally {
      setSavingAccess(false);
    }
  };

  const toggleDay = (day: string) => {
    setAccessDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (orgLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você ainda não está vinculado a uma organização. Entre em contato com o
            administrador do sistema.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os membros da sua organização
          </p>
        </div>

        {isAdmin && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Membro</DialogTitle>
                <DialogDescription>
                  Cria o acesso imediatamente, sem envio de e-mail. Anote as credenciais para repassar ao novo membro.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="memberEmail">E-mail *</Label>
                    <Input
                      id="memberEmail"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memberNome">Nome completo *</Label>
                    <Input
                      id="memberNome"
                      placeholder="Ex: João Silva"
                      value={memberNome}
                      onChange={(e) => setMemberNome(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberSenha" className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Senha temporária *
                  </Label>
                  <div className="relative">
                    <Input
                      id="memberSenha"
                      type={showMemberSenha ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={memberSenha}
                      onChange={(e) => setMemberSenha(e.target.value)}
                      className="font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMemberSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showMemberSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberRole">Cargo</Label>
                  <Select value={memberRole} onValueChange={(v) => setMemberRole(v as "gerente" | "vendedor")}>
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateMember}
                  disabled={createUser.isPending || !memberEmail || !memberNome || !memberSenha}
                  className="gap-2"
                >
                  {createUser.isPending ? "Criando..." : (
                    <><UserPlus className="h-4 w-4" /> Criar Membro</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Credentials card shown after member creation */}
      {createdCredentials && (
        <Card className="border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-base">
              <Check className="h-5 w-5" />
              Membro criado! Repasse estas credenciais ao novo colaborador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-zinc-900 p-4 space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Nome:</span>
                <span className="font-semibold flex-1 text-right">{createdCredentials.nome}</span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between gap-3">
                <span className="text-muted-foreground shrink-0">E-mail:</span>
                <div className="flex items-center gap-2 flex-1 justify-end">
                  <span className="font-semibold">{createdCredentials.email}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleCopyCredential(createdCredentials.email)}
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
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleCopyCredential(createdCredentials.password)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">
              A senha não será exibida novamente após fechar este card.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setCreatedCredentials(null)}>
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Info */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            {organization.nome}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {organization.cnpj && <span>CNPJ: {organization.cnpj}</span>}
            <Badge
              variant={organization.plano === "Enterprise" ? "default" : "secondary"}
              className="capitalize"
            >
              Plano {organization.plano}
            </Badge>
            <Badge variant={organization.ativo ? "outline" : "destructive"}>
              {organization.ativo ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum membro cadastrado
              </p>
            ) : (
              members.map((member) => {
                const primaryRole = member.roles[0]?.role || "vendedor";
                const roleInfo = roleLabels[primaryRole];
                const RoleIcon = roleInfo.icon;
                const isCurrentUser = member.id === user?.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${roleInfo.color}`}
                      >
                        <RoleIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{member.nome}</span>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                              Você
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {member.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isAdmin && !isCurrentUser ? (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-foreground"
                            title="Controle de Acesso"
                            onClick={() => openAccessModal(member)}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>

                          <Select
                            value={primaryRole}
                            onValueChange={(v) =>
                              handleRoleChange(member.id, v as any)
                            }
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="vendedor">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Vendedor
                                </div>
                              </SelectItem>
                              <SelectItem value="gerente">
                                <div className="flex items-center gap-2">
                                  <Briefcase className="h-4 w-4" />
                                  Gerente
                                </div>
                              </SelectItem>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4" />
                                  Administrador
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remover Membro</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja remover {member.nome} da
                                  organização? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleRemoveMember(member.id, member.nome)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remover
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert className="border-border bg-muted/50">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Segurança Multi-tenant:</strong> Cada organização possui isolamento
          completo de dados. Usuários só podem visualizar e editar registros da sua
          própria empresa. Todas as políticas de segurança são aplicadas automaticamente
          no nível do banco de dados.
        </AlertDescription>
      </Alert>

      {/* Access Control Modal */}
      <Dialog open={accessModalOpen} onOpenChange={setAccessModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-foreground" />
              Controle de Acesso — {accessMember?.nome}
            </DialogTitle>
            <DialogDescription>
              Defina os dias e horários em que este colaborador pode acessar o sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Days */}
            <div className="space-y-3">
              <Label>Dias permitidos</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OPTIONS.map((day) => (
                  <label
                    key={day.value}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors ${
                      accessDays.includes(day.value)
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Checkbox
                      checked={accessDays.includes(day.value)}
                      onCheckedChange={() => toggleDay(day.value)}
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horário Início</Label>
                <Input
                  type="time"
                  value={accessInicio}
                  onChange={(e) => setAccessInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário Fim</Label>
                <Input
                  type="time"
                  value={accessFim}
                  onChange={(e) => setAccessFim(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAccessModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAccess} disabled={savingAccess}>
              {savingAccess ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
