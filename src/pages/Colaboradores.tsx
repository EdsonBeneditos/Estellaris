import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Car,
  Accessibility,
  Clock,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Edit,
  Trash2,
  UserCheck,
  Palmtree,
  AlertCircle,
  UserX,
  Briefcase,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useColaboradores,
  useCreateColaborador,
  useUpdateColaborador,
  useDeleteColaborador,
  useColaboradoresProximosFerias,
  calculateMonthsSinceAdmission,
  Colaborador,
} from "@/hooks/useColaboradores";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Ativo: { label: "Ativo", color: "bg-emerald-500", icon: UserCheck },
  Férias: { label: "Férias", color: "bg-blue-500", icon: Palmtree },
  Afastado: { label: "Afastado", color: "bg-amber-500", icon: AlertCircle },
  Demitido: { label: "Demitido", color: "bg-red-500", icon: UserX },
  Inativo: { label: "Inativo", color: "bg-zinc-500", icon: UserX },
};

const turnoOptions = ["Manhã", "Tarde", "Noite", "12x36", "Flexível"];
const cnhCategories = ["A", "B", "C", "D", "E"];

function formatTelefone(value: string): string {
  // Remove tudo que não for dígito
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  // 11 dígitos: celular (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function isTelefoneValido(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

export default function Colaboradores() {
  const { data: profile } = useCurrentProfile();
  const { data: colaboradores = [], isLoading } = useColaboradores();
  const { data: proximosFerias = [] } = useColaboradoresProximosFerias();
  const createColaborador = useCreateColaborador();
  const updateColaborador = useUpdateColaborador();
  const deleteColaborador = useDeleteColaborador();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);

  // Form state with new fields
  const [formData, setFormData] = useState({
    nome: "",
    codigo_cadastro: "",
    cargo: "",
    turno: "",
    data_admissao: "",
    status: "Ativo",
    cnh_tipos: [] as string[],
    pcd: false,
    troca_turno: false,
    preferencia_turno: "",
    email_pessoal: "",
    telefone: "",
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo_cadastro: "",
      cargo: "",
      turno: "",
      data_admissao: "",
      status: "Ativo",
      cnh_tipos: [],
      pcd: false,
      troca_turno: false,
      preferencia_turno: "",
      email_pessoal: "",
      telefone: "",
    });
    setEditingColaborador(null);
  };

  const handleOpenModal = (colaborador?: Colaborador) => {
    if (colaborador) {
      setEditingColaborador(colaborador);
      setFormData({
        nome: colaborador.nome,
        codigo_cadastro: colaborador.codigo_cadastro || "",
        cargo: colaborador.cargo || "",
        turno: colaborador.turno || "",
        data_admissao: colaborador.data_admissao || "",
        status: colaborador.status || "Ativo",
        cnh_tipos: colaborador.cnh_tipos || [],
        pcd: colaborador.pcd || false,
        troca_turno: colaborador.troca_turno || false,
        preferencia_turno: colaborador.preferencia_turno || "",
        email_pessoal: colaborador.email_pessoal || "",
        telefone: colaborador.telefone || "",
      });
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (formData.telefone && !isTelefoneValido(formData.telefone)) {
      toast.error("Telefone inválido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX");
      return;
    }

    try {
      if (editingColaborador) {
        await updateColaborador.mutateAsync({
          id: editingColaborador.id,
          nome: formData.nome,
          codigo_cadastro: formData.codigo_cadastro || null,
          cargo: formData.cargo || null,
          turno: formData.turno || null,
          data_admissao: formData.data_admissao || null,
          status: formData.status,
          cnh_tipos: formData.cnh_tipos.length > 0 ? formData.cnh_tipos : null,
          pcd: formData.pcd,
          troca_turno: formData.troca_turno,
          preferencia_turno: formData.preferencia_turno || null,
          email_pessoal: formData.email_pessoal || null,
          telefone: formData.telefone || null,
          organization_id: profile?.organization_id || null,
        });
        toast.success("Colaborador atualizado com sucesso!");
      } else {
        await createColaborador.mutateAsync({
          nome: formData.nome,
          codigo_cadastro: formData.codigo_cadastro || null,
          cargo: formData.cargo || null,
          turno: formData.turno || null,
          data_admissao: formData.data_admissao || null,
          status: formData.status,
          cnh_tipos: formData.cnh_tipos.length > 0 ? formData.cnh_tipos : null,
          pcd: formData.pcd,
          troca_turno: formData.troca_turno,
          preferencia_turno: formData.preferencia_turno || null,
          email_pessoal: formData.email_pessoal || null,
          telefone: formData.telefone || null,
          organization_id: profile?.organization_id || null,
          tipo_carteira: null,
        });
        toast.success("Colaborador cadastrado com sucesso!");
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar colaborador");
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    try {
      await deleteColaborador.mutateAsync(id);
      toast.success(`${nome} removido com sucesso`);
    } catch (error) {
      toast.error("Erro ao remover colaborador");
    }
  };

  const toggleCnhCategory = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      cnh_tipos: prev.cnh_tipos.includes(category)
        ? prev.cnh_tipos.filter((c) => c !== category)
        : [...prev.cnh_tipos, category],
    }));
  };

  // Filter colaboradores
  const filteredColaboradores = colaboradores.filter((c) => {
    const matchesSearch =
      c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.codigo_cadastro?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email_pessoal?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cargo?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
            Gestão de Colaboradores
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastro e gerenciamento de funcionários
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Colaborador
        </Button>
      </div>

      {/* Vacation Alert */}
      {proximosFerias.length > 0 && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700 dark:text-amber-400">
            Alerta de Férias Próximas
          </AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-300">
            {proximosFerias.length} colaborador(es) com 11+ meses de admissão e
            elegíveis para férias: {proximosFerias.map((c) => c.nome).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards - Grid with padding for hover effects */}
      <div className="grid gap-4 md:grid-cols-5 p-1 -m-1">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = colaboradores.filter((c) => c.status === status).length;
          const Icon = config.icon;
          return (
            <Card
              key={status}
              className="relative border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:border-primary/30 hover:z-10 cursor-pointer"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-2 rounded-lg ${config.color} transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">
                    {count}
                  </p>
                  <p className="text-sm text-muted-foreground">{config.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, código, cargo ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-slate-50 dark:bg-zinc-950">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Colaboradores List with Accordions */}
      <Card className="border-zinc-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50">
            <Users className="h-5 w-5" />
            Colaboradores ({filteredColaboradores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredColaboradores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum colaborador encontrado
            </p>
          ) : (
            <Accordion type="single" collapsible className="space-y-2">
              {filteredColaboradores.map((colaborador) => {
                const statusInfo = statusConfig[colaborador.status || "Ativo"];
                const StatusIcon = statusInfo.icon;
                const mesesAdmissao = calculateMonthsSinceAdmission(
                  colaborador.data_admissao
                );
                const isNearVacation = mesesAdmissao >= 11 && mesesAdmissao < 12;
                const showDetails =
                  colaborador.status === "Férias" ||
                  colaborador.status === "Afastado" ||
                  isNearVacation;

                return (
                  <AccordionItem
                    key={colaborador.id}
                    value={colaborador.id}
                    className="border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 data-[state=open]:bg-zinc-100 dark:data-[state=open]:bg-zinc-900 transition-all duration-200 hover:scale-[1.01] hover:shadow-md hover:border-primary/30"
                  >
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-10 w-10 rounded-full flex items-center justify-center text-white ${statusInfo.color}`}
                          >
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-950 dark:text-zinc-50">
                                {colaborador.nome}
                              </span>
                              {isNearVacation && (
                                <Badge
                                  variant="outline"
                                  className="text-xs border-amber-500 text-amber-600 dark:text-amber-400"
                                >
                                  <Palmtree className="h-3 w-3 mr-1" />
                                  Próximo a Férias
                                </Badge>
                              )}
                              {colaborador.pcd && (
                                <Badge variant="secondary" className="text-xs">
                                  <Accessibility className="h-3 w-3 mr-1" />
                                  PCD
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {colaborador.cargo && (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {colaborador.cargo}
                                </span>
                              )}
                              {colaborador.turno && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {colaborador.turno}
                                </span>
                              )}
                              {colaborador.codigo_cadastro && (
                                <span>Cód: {colaborador.codigo_cadastro}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${statusInfo.color} text-white`}>
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
                        {/* Contact Info */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                            Contato
                          </h4>
                          {colaborador.telefone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {colaborador.telefone}
                            </div>
                          )}
                          {colaborador.email_pessoal && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {colaborador.email_pessoal}
                            </div>
                          )}
                        </div>

                        {/* Technical Info - CNH */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                            CNH
                          </h4>
                          {colaborador.cnh_tipos && colaborador.cnh_tipos.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {colaborador.cnh_tipos.map((cat) => (
                                <Badge key={cat} variant="outline" className="text-xs">
                                  <Car className="h-3 w-3 mr-1" />
                                  {cat}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Não informado</span>
                          )}
                        </div>

                        {/* Turno Info */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                            Turno
                          </h4>
                          {colaborador.turno && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {colaborador.turno}
                            </div>
                          )}
                          {colaborador.preferencia_turno && (
                            <div className="text-sm text-muted-foreground">
                              Preferência: {colaborador.preferencia_turno}
                            </div>
                          )}
                          {colaborador.troca_turno && (
                            <Badge variant="outline" className="text-xs">
                              Aceita troca de turno
                            </Badge>
                          )}
                        </div>

                        {/* Admission Info */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                            Tempo de Empresa
                          </h4>
                          {colaborador.data_admissao && (
                            <>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Admissão:{" "}
                                {format(
                                  parseISO(colaborador.data_admissao),
                                  "dd/MM/yyyy",
                                  { locale: ptBR }
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {mesesAdmissao} meses de empresa
                              </div>
                              {isNearVacation && (
                                <Alert className="border-amber-500/30 bg-amber-500/10 p-2">
                                  <AlertDescription className="text-xs text-amber-600 dark:text-amber-400">
                                    Elegível para férias em breve!
                                  </AlertDescription>
                                </Alert>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(colaborador)}
                          className="gap-1"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir {colaborador.nome}? Esta
                                ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(colaborador.id, colaborador.nome)
                                }
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingColaborador ? "Editar Colaborador" : "Novo Colaborador"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do colaborador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Informações Básicas
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    placeholder="Nome do colaborador"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código de Cadastro</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo_cadastro}
                    onChange={(e) =>
                      setFormData({ ...formData, codigo_cadastro: e.target.value })
                    }
                    placeholder="Ex: 00123"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) =>
                      setFormData({ ...formData, cargo: e.target.value })
                    }
                    placeholder="Ex: Operador, Motorista, Supervisor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="turno">Turno</Label>
                  <Select
                    value={formData.turno}
                    onValueChange={(v) => setFormData({ ...formData, turno: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                    <SelectContent>
                      {turnoOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admissao">Data de Admissão</Label>
                  <Input
                    id="admissao"
                    type="date"
                    value={formData.data_admissao}
                    onChange={(e) =>
                      setFormData({ ...formData, data_admissao: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">Contato</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telefone: formatTelefone(e.target.value),
                      })
                    }
                    placeholder="(11) 99999-9999"
                    inputMode="numeric"
                  />
                  {formData.telefone && !isTelefoneValido(formData.telefone) && (
                    <p className="text-xs text-destructive">
                      Formato inválido. Ex: (11) 99999-9999
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Pessoal</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email_pessoal}
                    onChange={(e) =>
                      setFormData({ ...formData, email_pessoal: e.target.value })
                    }
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Technical Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                Ficha Técnica
              </h3>
              
              {/* CNH Multi-select Tags */}
              <div className="space-y-2">
                <Label>Categorias de CNH</Label>
                <div className="flex flex-wrap gap-2">
                  {cnhCategories.map((cat) => {
                    const isSelected = formData.cnh_tipos.includes(cat);
                    return (
                      <Badge
                        key={cat}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => toggleCnhCategory(cat)}
                      >
                        <Car className="h-3 w-3 mr-1" />
                        {cat}
                        {isSelected && (
                          <X className="h-3 w-3 ml-1" />
                        )}
                      </Badge>
                    );
                  })}
                </div>
                {formData.cnh_tipos.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selecionadas: {formData.cnh_tipos.join(", ")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefTurno">Preferência de Turno</Label>
                <Select
                  value={formData.preferencia_turno}
                  onValueChange={(v) =>
                    setFormData({ ...formData, preferencia_turno: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {turnoOptions.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="pcd"
                    checked={formData.pcd}
                    onCheckedChange={(v) => setFormData({ ...formData, pcd: v })}
                  />
                  <Label htmlFor="pcd" className="flex items-center gap-1">
                    <Accessibility className="h-4 w-4" />
                    PCD (Pessoa com Deficiência)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="trocaTurno"
                    checked={formData.troca_turno}
                    onCheckedChange={(v) =>
                      setFormData({ ...formData, troca_turno: v })
                    }
                  />
                  <Label htmlFor="trocaTurno">Aceita Troca de Turno</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createColaborador.isPending || updateColaborador.isPending}
            >
              {createColaborador.isPending || updateColaborador.isPending
                ? "Salvando..."
                : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
