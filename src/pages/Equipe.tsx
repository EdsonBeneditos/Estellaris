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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";

const roleLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: "Administrador", icon: Crown, color: "bg-amber-500" },
  gerente: { label: "Gerente", icon: Briefcase, color: "bg-blue-500" },
  vendedor: { label: "Vendedor", icon: User, color: "bg-emerald-500" },
};

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
    // Por enquanto, apenas mostrar instruções
    // A implementação completa requer edge functions para enviar convites
    toast.info(
      "Para adicionar novos membros, crie o usuário no Supabase Dashboard e depois adicione o perfil aqui."
    );
    setIsInviteOpen(false);
    setInviteEmail("");
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
      <Card className="border-zinc-200 dark:border-zinc-800">
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
      <Card className="border-zinc-200 dark:border-zinc-800">
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
                    className="flex items-center justify-between p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50"
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
      <Alert className="border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900">
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Segurança Multi-tenant:</strong> Cada organização possui isolamento
          completo de dados. Usuários só podem visualizar e editar registros da sua
          própria empresa. Todas as políticas de segurança são aplicadas automaticamente
          no nível do banco de dados.
        </AlertDescription>
      </Alert>
    </div>
  );
}
