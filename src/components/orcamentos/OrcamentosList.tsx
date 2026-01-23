import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrcamentos, useDeleteOrcamento, useUpdateOrcamento, Orcamento } from "@/hooks/useOrcamentos";

interface OrcamentosListProps {
  onNewOrcamento: () => void;
  onEditOrcamento: (orcamento: Orcamento) => void;
  onViewOrcamento: (orcamento: Orcamento) => void;
  onGeneratePdf: (orcamento: Orcamento) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ComponentType<{ className?: string }> }> = {
  Pendente: { label: "Pendente", variant: "secondary", icon: Clock },
  Aprovado: { label: "Aprovado", variant: "default", icon: CheckCircle },
  Cancelado: { label: "Cancelado", variant: "destructive", icon: XCircle },
};

export function OrcamentosList({ onNewOrcamento, onEditOrcamento, onViewOrcamento, onGeneratePdf }: OrcamentosListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);

  const { data: orcamentos, isLoading } = useOrcamentos();
  const { mutate: deleteOrcamento } = useDeleteOrcamento();
  const { mutate: updateOrcamento } = useUpdateOrcamento();

  const filteredOrcamentos = orcamentos?.filter((orcamento) => {
    const matchesSearch =
      orcamento.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      orcamento.numero_orcamento.toString().includes(search) ||
      orcamento.cliente_cnpj?.includes(search);
    
    const matchesStatus = statusFilter === "all" || orcamento.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDelete = () => {
    if (selectedOrcamento) {
      deleteOrcamento(selectedOrcamento.id);
      setDeleteDialogOpen(false);
      setSelectedOrcamento(null);
    }
  };

  const handleStatusChange = (orcamento: Orcamento, newStatus: string) => {
    updateOrcamento({ id: orcamento.id, data: { status: newStatus } });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Orçamentos</h2>
          <p className="text-muted-foreground">Gerencie seus orçamentos e vendas</p>
        </div>
        <Button onClick={onNewOrcamento} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, nº orçamento ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Aprovado">Aprovado</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredOrcamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground">Nenhum orçamento encontrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || statusFilter !== "all"
                ? "Tente ajustar os filtros"
                : "Clique em 'Novo Orçamento' para criar um"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrcamentos.map((orcamento) => {
            const statusInfo = statusConfig[orcamento.status] || statusConfig.Pendente;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={orcamento.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            #{String(orcamento.numero_orcamento).padStart(5, "0")}
                          </span>
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {orcamento.cliente_nome || "Cliente não informado"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(orcamento.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          {orcamento.data_validade && (
                            <> • Válido até {format(new Date(orcamento.data_validade), "dd/MM/yyyy")}</>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(orcamento.valor_total)}
                        </p>
                        {orcamento.desconto_total > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Desconto: {formatCurrency(orcamento.desconto_total)}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewOrcamento(orcamento)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar NF-e
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onGeneratePdf(orcamento)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Gerar PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEditOrcamento(orcamento)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {orcamento.status === "Pendente" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(orcamento, "Aprovado")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Aprovar Venda
                            </DropdownMenuItem>
                          )}
                          {orcamento.status !== "Cancelado" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(orcamento, "Cancelado")}>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" />
                              Cancelar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedOrcamento(orcamento);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o orçamento #{selectedOrcamento?.numero_orcamento}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
