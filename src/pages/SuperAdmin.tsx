import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/hooks/useSuperAdmin";
import { toast } from "sonner";

export default function SuperAdmin() {
  const { data: organizations = [], isLoading } = useAllOrganizations();
  const createOrg = useCreateOrganization();
  const inviteUser = useInviteUser();

  // Create Org State
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgCnpj, setNewOrgCnpj] = useState("");
  const [newOrgPlano, setNewOrgPlano] = useState<"Basico" | "Pro" | "Enterprise">("Basico");

  // Invite User State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteOrgId, setInviteOrgId] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "gerente" | "vendedor">("vendedor");

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) {
      toast.error("Nome da organização é obrigatório");
      return;
    }

    try {
      await createOrg.mutateAsync({
        nome: newOrgName,
        cnpj: newOrgCnpj || undefined,
        plano: newOrgPlano,
      });
      toast.success("Organização criada com sucesso!");
      setIsCreateOrgOpen(false);
      setNewOrgName("");
      setNewOrgCnpj("");
      setNewOrgPlano("Basico");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar organização");
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !inviteOrgId) {
      toast.error("E-mail e organização são obrigatórios");
      return;
    }

    try {
      await inviteUser.mutateAsync({
        email: inviteEmail,
        organizationId: inviteOrgId,
        role: inviteRole,
        nome: inviteNome || undefined,
      });
      toast.success(`Convite enviado para ${inviteEmail}!`);
      setIsInviteOpen(false);
      setInviteEmail("");
      setInviteNome("");
      setInviteOrgId("");
      setInviteRole("vendedor");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar convite");
    }
  };

  const planoColors = {
    Basico: "bg-zinc-500",
    Pro: "bg-blue-500",
    Enterprise: "bg-amber-500",
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            Gerencie organizações e usuários do sistema
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
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Organização</DialogTitle>
                  <DialogDescription>
                    Preencha os dados para criar uma nova empresa no sistema.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
                  <div className="space-y-2">
                    <Label htmlFor="orgPlano">Plano</Label>
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
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateOrgOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateOrg} disabled={createOrg.isPending}>
                    {createOrg.isPending ? "Criando..." : "Criar Organização"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <Card
                key={org.id}
                className="border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950"
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
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant={org.ativo ? "outline" : "destructive"} className="text-xs">
                      {org.ativo ? (
                        <span className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> Ativo
                        </span>
                      ) : (
                        "Inativo"
                      )}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      ID: {org.id.slice(0, 8)}...
                    </span>
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

        {/* Invite Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50">
                <UserPlus className="h-5 w-5" />
                Convidar Novo Usuário
              </CardTitle>
              <CardDescription>
                Envie um convite por e-mail para adicionar um usuário a uma organização
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
                  <Label htmlFor="invNome">Nome</Label>
                  <Input
                    id="invNome"
                    placeholder="Nome do usuário"
                    value={inviteNome}
                    onChange={(e) => setInviteNome(e.target.value)}
                  />
                </div>
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
                  onClick={handleInviteUser}
                  disabled={inviteUser.isPending || !inviteEmail || !inviteOrgId}
                  className="gap-2"
                >
                  {inviteUser.isPending ? (
                    "Enviando..."
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Enviar Convite
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert className="border-blue-500/30 bg-blue-500/10">
            <Shield className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              O usuário receberá um e-mail com link para definir sua senha e acessar o
              sistema. Ele será automaticamente vinculado à organização selecionada com
              o cargo definido.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
