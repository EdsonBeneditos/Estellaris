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
  MapPin,
  FileText,
  Gift,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  useColaboradores,
  useCreateColaborador,
  useUpdateColaborador,
  useDeleteColaborador,
  useColaboradoresProximosFerias,
  calculateMonthsSinceDate,
  isNearVacation,
  Colaborador,
} from "@/hooks/useColaboradores";
import { useViaCep } from "@/hooks/useViaCep";
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
const beneficiosOptions = ["Vale-transporte", "Vale-combustível", "Nenhum"];

function formatTelefone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function isTelefoneValido(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

const emptyForm = {
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
  tipo_contrato: "" as string,
  beneficios: [] as string[],
  data_ultima_ferias: "",
  data_retorno_ferias: "",
  cep: "",
  logradouro: "",
  bairro: "",
  cidade: "",
  estado: "",
  numero_endereco: "",
  complemento: "",
};

export default function Colaboradores() {
  const { data: profile } = useCurrentProfile();
  const { data: colaboradores = [], isLoading } = useColaboradores();
  const { data: proximosFerias = [] } = useColaboradoresProximosFerias();
  const createColaborador = useCreateColaborador();
  const updateColaborador = useUpdateColaborador();
  const deleteColaborador = useDeleteColaborador();
  const { fetchAddress, isLoading: isCepLoading } = useViaCep();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Create/Edit modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingColaborador, setEditingColaborador] = useState<Colaborador | null>(null);

  // Detail popup
  const [detailColaborador, setDetailColaborador] = useState<Colaborador | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Colaborador | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formData, setFormData] = useState({ ...emptyForm });

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingColaborador(null);
  };

  const handleOpenForm = (colaborador?: Colaborador) => {
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
        tipo_contrato: colaborador.tipo_contrato || "",
        beneficios: colaborador.beneficios || [],
        data_ultima_ferias: colaborador.data_ultima_ferias || "",
        data_retorno_ferias: colaborador.data_retorno_ferias || "",
        cep: colaborador.cep || "",
        logradouro: colaborador.logradouro || "",
        bairro: colaborador.bairro || "",
        cidade: colaborador.cidade || "",
        estado: colaborador.estado || "",
        numero_endereco: colaborador.numero_endereco || "",
        complemento: colaborador.complemento || "",
      });
    } else {
      resetForm();
    }
    setIsDetailOpen(false);
    setIsFormOpen(true);
  };

  const handleCardClick = (colaborador: Colaborador) => {
    setDetailColaborador(colaborador);
    setIsDetailOpen(true);
  };

  const handleDeleteRequest = (colaborador: Colaborador) => {
    setDeleteTarget(colaborador);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteColaborador.mutateAsync(deleteTarget.id);
      toast.success(`${deleteTarget.nome} removido com sucesso`);
      setIsDeleteOpen(false);
      setIsDetailOpen(false);
      setDeleteTarget(null);
    } catch {
      toast.error("Erro ao remover colaborador");
    }
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setFormData((prev) => ({ ...prev, cep: formatted }));
    const digits = value.replace(/\D/g, "");
    if (digits.length === 8) {
      const result = await fetchAddress(digits);
      if (result) {
        setFormData((prev) => ({
          ...prev,
          logradouro: result.logradouro || prev.logradouro,
          bairro: result.bairro || prev.bairro,
          cidade: result.localidade || prev.cidade,
          estado: result.uf || prev.estado,
        }));
      }
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

  const toggleBeneficio = (beneficio: string) => {
    setFormData((prev) => {
      let next: string[];
      if (beneficio === "Nenhum") {
        // selecting Nenhum clears others; deselecting it clears it
        next = prev.beneficios.includes("Nenhum") ? [] : ["Nenhum"];
      } else {
        // selecting any other option removes "Nenhum"
        const without = prev.beneficios.filter((b) => b !== "Nenhum");
        next = without.includes(beneficio)
          ? without.filter((b) => b !== beneficio)
          : [...without, beneficio];
      }
      return { ...prev, beneficios: next };
    });
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!formData.tipo_contrato) {
      toast.error("Tipo de contrato é obrigatório");
      return;
    }
    if (formData.beneficios.length === 0) {
      toast.error("Selecione ao menos um benefício");
      return;
    }
    if (formData.telefone && !isTelefoneValido(formData.telefone)) {
      toast.error("Telefone inválido. Use o formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX");
      return;
    }

    const payload = {
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
      tipo_contrato: formData.tipo_contrato || null,
      beneficios: formData.beneficios.length > 0 ? formData.beneficios : null,
      data_ultima_ferias: formData.data_ultima_ferias || null,
      data_retorno_ferias: formData.data_retorno_ferias || null,
      cep: formData.cep || null,
      logradouro: formData.logradouro || null,
      bairro: formData.bairro || null,
      cidade: formData.cidade || null,
      estado: formData.estado || null,
      numero_endereco: formData.numero_endereco || null,
      complemento: formData.complemento || null,
      organization_id: profile?.organization_id || null,
    };

    try {
      if (editingColaborador) {
        await updateColaborador.mutateAsync({ id: editingColaborador.id, ...payload });
        toast.success("Colaborador atualizado com sucesso!");
      } else {
        await createColaborador.mutateAsync({ ...payload, tipo_carteira: null });
        toast.success("Colaborador cadastrado com sucesso!");
      }
      setIsFormOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar colaborador");
    }
  };

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
        <Button onClick={() => handleOpenForm()} className="gap-2">
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
            {proximosFerias.length} colaborador(es) elegíveis para férias:{" "}
            {proximosFerias.map((c) => c.nome).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
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
                <div className={`p-2 rounded-lg ${config.color}`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{count}</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

      {/* Colaboradores List — scrollable, max 6 items */}
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
            <div
              className="space-y-2 overflow-y-auto pr-1"
              style={{ maxHeight: "calc(6 * 5rem + 5 * 0.5rem)" }}
            >
              {filteredColaboradores.map((colaborador) => {
                const statusInfo = statusConfig[colaborador.status || "Ativo"];
                const StatusIcon = statusInfo.icon;
                const nearVacation = isNearVacation(colaborador);
                const refDate =
                  colaborador.data_retorno_ferias || colaborador.data_admissao;
                const meses = calculateMonthsSinceDate(refDate);

                return (
                  <button
                    key={colaborador.id}
                    onClick={() => handleCardClick(colaborador)}
                    className="w-full text-left border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 transition-all duration-150 hover:scale-[1.01] hover:shadow-md hover:border-primary/40 bg-white dark:bg-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-white ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-zinc-950 dark:text-zinc-50 truncate">
                              {colaborador.nome}
                            </span>
                            {nearVacation && (
                              <Badge
                                variant="outline"
                                className="text-xs border-amber-500 text-amber-600 dark:text-amber-400 shrink-0"
                              >
                                <Palmtree className="h-3 w-3 mr-1" />
                                Férias Próximas
                              </Badge>
                            )}
                            {colaborador.pcd && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                <Accessibility className="h-3 w-3 mr-1" />
                                PCD
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-0.5">
                            {colaborador.cargo && (
                              <span className="flex items-center gap-1">
                                <Briefcase className="h-3 w-3" />
                                {colaborador.cargo}
                              </span>
                            )}
                            {colaborador.tipo_contrato && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {colaborador.tipo_contrato}
                              </span>
                            )}
                            {colaborador.telefone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {colaborador.telefone}
                              </span>
                            )}
                            {refDate && (
                              <span className="text-xs opacity-70">{meses}m empresa</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge className={`${statusInfo.color} text-white shrink-0`}>
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detail Popup ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200">
          {detailColaborador && (() => {
            const col = detailColaborador;
            const statusInfo = statusConfig[col.status || "Ativo"];
            const StatusIcon = statusInfo.icon;
            const nearVacation = isNearVacation(col);
            const refDate = col.data_retorno_ferias || col.data_admissao;
            const meses = calculateMonthsSinceDate(refDate);

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-14 w-14 rounded-full flex items-center justify-center text-white ${statusInfo.color} shrink-0`}
                    >
                      <StatusIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <DialogTitle className="text-xl">{col.nome}</DialogTitle>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge className={`${statusInfo.color} text-white`}>
                          {statusInfo.label}
                        </Badge>
                        {col.tipo_contrato && (
                          <Badge variant="outline">{col.tipo_contrato}</Badge>
                        )}
                        {col.pcd && (
                          <Badge variant="secondary">
                            <Accessibility className="h-3 w-3 mr-1" />
                            PCD
                          </Badge>
                        )}
                        {nearVacation && (
                          <Badge
                            variant="outline"
                            className="border-amber-500 text-amber-600 dark:text-amber-400"
                          >
                            <Palmtree className="h-3 w-3 mr-1" />
                            Férias Próximas
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogDescription className="sr-only">
                    Detalhes de {col.nome}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 mt-2">
                  {/* Basic */}
                  <Section title="Informações Básicas">
                    <InfoGrid>
                      <InfoItem label="Código" value={col.codigo_cadastro} />
                      <InfoItem label="Cargo" value={col.cargo} icon={<Briefcase className="h-4 w-4" />} />
                      <InfoItem label="Turno" value={col.turno} icon={<Clock className="h-4 w-4" />} />
                      <InfoItem
                        label="Admissão"
                        value={
                          col.data_admissao
                            ? format(parseISO(col.data_admissao), "dd/MM/yyyy", { locale: ptBR })
                            : null
                        }
                        icon={<Calendar className="h-4 w-4" />}
                      />
                      {refDate && (
                        <InfoItem label="Tempo de empresa" value={`${meses} meses`} />
                      )}
                      {col.data_ultima_ferias && (
                        <InfoItem
                          label="Última saída de férias"
                          value={format(parseISO(col.data_ultima_ferias), "dd/MM/yyyy", { locale: ptBR })}
                          icon={<Palmtree className="h-4 w-4" />}
                        />
                      )}
                      {col.data_retorno_ferias && (
                        <InfoItem
                          label="Retorno das férias"
                          value={format(parseISO(col.data_retorno_ferias), "dd/MM/yyyy", { locale: ptBR })}
                          icon={<Calendar className="h-4 w-4" />}
                        />
                      )}
                    </InfoGrid>
                  </Section>

                  {/* Contact */}
                  <Section title="Contato">
                    <InfoGrid>
                      <InfoItem label="Telefone" value={col.telefone} icon={<Phone className="h-4 w-4" />} />
                      <InfoItem label="E-mail" value={col.email_pessoal} icon={<Mail className="h-4 w-4" />} />
                    </InfoGrid>
                  </Section>

                  {/* Address */}
                  {(col.cep || col.logradouro || col.cidade) && (
                    <Section title="Endereço">
                      <InfoGrid>
                        <InfoItem label="CEP" value={col.cep} icon={<MapPin className="h-4 w-4" />} />
                        <InfoItem label="Logradouro" value={col.logradouro} />
                        <InfoItem label="Número" value={col.numero_endereco} />
                        <InfoItem label="Complemento" value={col.complemento} />
                        <InfoItem label="Bairro" value={col.bairro} />
                        <InfoItem label="Cidade" value={col.cidade} />
                        <InfoItem label="Estado" value={col.estado} />
                      </InfoGrid>
                    </Section>
                  )}

                  {/* Benefits & CNH */}
                  <Section title="Benefícios e Habilitação">
                    <InfoGrid>
                      {col.beneficios && col.beneficios.length > 0 && (
                        <div className="col-span-full space-y-1">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Benefícios</p>
                          <div className="flex flex-wrap gap-1">
                            {col.beneficios.map((b) => (
                              <Badge key={b} variant="outline" className="gap-1">
                                <Gift className="h-3 w-3" />
                                {b}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {col.cnh_tipos && col.cnh_tipos.length > 0 && (
                        <div className="col-span-full space-y-1">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">CNH</p>
                          <div className="flex flex-wrap gap-1">
                            {col.cnh_tipos.map((cat) => (
                              <Badge key={cat} variant="outline" className="gap-1">
                                <Car className="h-3 w-3" />
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </InfoGrid>
                  </Section>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenForm(col)}
                    className="gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteRequest(col)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.nome}</strong>? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Create / Edit Form ── */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 duration-200">
          <DialogHeader>
            <DialogTitle>
              {editingColaborador ? "Editar Colaborador" : "Novo Colaborador"}
            </DialogTitle>
            <DialogDescription>Preencha os dados do colaborador</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* ── Informações Básicas ── */}
            <FormSection title="Informações Básicas">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Nome do colaborador"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigo">Código de Cadastro</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo_cadastro}
                    onChange={(e) => setFormData({ ...formData, codigo_cadastro: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    placeholder="Ex: Operador, Motorista"
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
                    onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
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

              {/* Data retorno férias — only when status === Férias */}
              {formData.status === "Férias" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dataUltimaFerias">Data de Saída de Férias</Label>
                    <Input
                      id="dataUltimaFerias"
                      type="date"
                      value={formData.data_ultima_ferias}
                      onChange={(e) =>
                        setFormData({ ...formData, data_ultima_ferias: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataRetornoFerias">Data de Retorno das Férias</Label>
                    <Input
                      id="dataRetornoFerias"
                      type="date"
                      value={formData.data_retorno_ferias}
                      onChange={(e) =>
                        setFormData({ ...formData, data_retorno_ferias: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </FormSection>

            {/* ── Tipo de Contrato ── */}
            <FormSection title="Tipo de Contrato *">
              <div className="flex gap-6">
                {(["CLT", "PJ"] as const).map((tipo) => (
                  <label
                    key={tipo}
                    className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-all ${
                      formData.tipo_contrato === tipo
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipo_contrato"
                      value={tipo}
                      checked={formData.tipo_contrato === tipo}
                      onChange={() => setFormData({ ...formData, tipo_contrato: tipo })}
                      className="sr-only"
                    />
                    <FileText className="h-4 w-4" />
                    {tipo}
                  </label>
                ))}
              </div>
            </FormSection>

            {/* ── Benefícios ── */}
            <FormSection title="Benefícios *">
              <div className="flex flex-wrap gap-4">
                {beneficiosOptions.map((beneficio) => (
                  <label
                    key={beneficio}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.beneficios.includes(beneficio)}
                      onCheckedChange={() => toggleBeneficio(beneficio)}
                    />
                    <span className="text-sm">{beneficio}</span>
                  </label>
                ))}
              </div>
              {formData.beneficios.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Selecione ao menos um benefício.
                </p>
              )}
            </FormSection>

            {/* ── Contato ── */}
            <FormSection title="Contato">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: formatTelefone(e.target.value) })
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
            </FormSection>

            {/* ── Endereço ── */}
            <FormSection title="Endereço">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <div className="relative">
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      placeholder="00000-000"
                      inputMode="numeric"
                      maxLength={9}
                    />
                    {isCepLoading && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-b-2 border-primary rounded-full" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="logradouro">Logradouro</Label>
                  <Input
                    id="logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    placeholder="Rua, Avenida..."
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input
                    id="numero"
                    value={formData.numero_endereco}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_endereco: e.target.value })
                    }
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input
                    id="complemento"
                    value={formData.complemento}
                    onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    placeholder="Apto, Bloco..."
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro</Label>
                  <Input
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="UF"
                    maxLength={2}
                  />
                </div>
              </div>
            </FormSection>

            {/* ── Ficha Técnica ── */}
            <FormSection title="Ficha Técnica">
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
                        {isSelected && <X className="h-3 w-3 ml-1" />}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefTurno">Preferência de Turno</Label>
                <Select
                  value={formData.preferencia_turno}
                  onValueChange={(v) => setFormData({ ...formData, preferencia_turno: v })}
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
                    onCheckedChange={(v) => setFormData({ ...formData, troca_turno: v })}
                  />
                  <Label htmlFor="trocaTurno">Aceita Troca de Turno</Label>
                </div>
              </div>
            </FormSection>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
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

/* ── Small layout helpers ── */

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-zinc-900 dark:text-zinc-100 border-b border-zinc-100 dark:border-zinc-800 pb-1">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">
        {title}
      </h4>
      {children}
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | null | undefined;
  icon?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
        {icon}
        {value}
      </p>
    </div>
  );
}
