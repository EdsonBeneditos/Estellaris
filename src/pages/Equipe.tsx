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
  Settings,
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

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"vendedor" | "gerente" | "admin">("vendedor");
  const [isInviteOpen, setIsInviteOpen] = useState(false);

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

  const handleInvite = async () => {
    toast.info(
      "Para adicionar novos membros, crie o usuário no Supabase Dashboard e depois adicione o perfil aqui."
    );
    setIsInviteOpen(false);
    setInviteEmail("");
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
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Membro</DialogTitle>
                <DialogDescription>
                  Adicione um novo membro à sua organização
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Cargo</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vendedor">Vendedor</SelectItem>
                      <SelectItem value="gerente">Gerente</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    O usuário precisará ter uma conta ativa no sistema para acessar a
                    organização.
                  </AlertDescription>
                </Alert>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleInvite} disabled={!inviteEmail}>
                  Enviar Convite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
              <Clock className="h-5 w-5" />
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
