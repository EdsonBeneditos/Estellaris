import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
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
  Receipt,
  ChevronLeft,
  ChevronRight,
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
import { Card, CardContent } from "@/components/ui/card";
import { useOrcamentos, useDeleteOrcamento, useUpdateOrcamento, Orcamento } from "@/hooks/useOrcamentos";
import { CancelarOrcamentoModal } from "./CancelarOrcamentoModal";

interface OrcamentosListProps {
  onNewOrcamento: () => void;
  onEditOrcamento: (orcamento: Orcamento) => void;
  onViewOrcamento: (orcamento: Orcamento) => void;
  onGeneratePdf: (orcamento: Orcamento) => void;
}

const ITEMS_PER_PAGE = 15;

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; icon: React.ComponentType<{ className?: string }> }> = {
  Pendente: { label: "Pendente", variant: "secondary", icon: Clock },
  Aprovado: { label: "Aprovado", variant: "default", icon: CheckCircle },
  Cancelado: { label: "Cancelado", variant: "destructive", icon: XCircle },
};

export function OrcamentosList({ onNewOrcamento, onEditOrcamento, onViewOrcamento, onGeneratePdf }: OrcamentosListProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelOrcamento, setCancelOrcamento] = useState<Orcamento | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: orcamentos, isLoading } = useOrcamentos();
  const { mutate: deleteOrcamento } = useDeleteOrcamento();
  const { mutate: updateOrcamento } = useUpdateOrcamento();

  const handleGenerateNfe = (orcamento: Orcamento) => {
    navigate(`/notas-fiscais?orcamento=${orcamento.id}`);
  };

  const filteredOrcamentos = orcamentos?.filter((orcamento) => {
    const matchesSearch =
      orcamento.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      orcamento.numero_orcamento.toString().includes(search) ||
      orcamento.cliente_cnpj?.includes(search);
    const matchesStatus = statusFilter === "all" || orcamento.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredOrcamentos.length / ITEMS_PER_PAGE);
  const paginatedOrcamentos = filteredOrcamentos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleSearchChange = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleStatusChange = (val: string) => { setStatusFilter(val); setCurrentPage(1); };

  const handleDelete = () => {
    if (selectedOrcamento) {
      deleteOrcamento(selectedOrcamento.id);
      setDeleteDialogOpen(false);
      setSelectedOrcamento(null);
    }
  };

  const handleOrcamentoStatusChange = (orcamento: Orcamento, newStatus: string) => {
    const extra = newStatus === "Aprovado" ? { status_financeiro: "aguardando_pagamento" } : {};
    updateOrcamento({ id: orcamento.id, data: { status: newStatus, ...extra } as any });
  };

  const handleCancelApproved = (orcamento: Orcamento) => {
    setCancelOrcamento(orcamento);
    setCancelModalOpen(true);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Orçamentos</h2>
          <p className="text-xs text-muted-foreground">
            Gerencie seus orçamentos e vendas.
          </p>
        </div>
        <Button onClick={onNewOrcamento} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, nº ou CNPJ..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[160px] h-9">
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
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
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : paginatedOrcamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="mb-3 h-10 w-10 text-muted-foreground/50" />
            <h3 className="text-sm font-medium text-foreground">Nenhum orçamento encontrado</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || statusFilter !== "all" ? "Tente ajustar os filtros" : "Clique em 'Novo Orçamento' para criar um"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {paginatedOrcamentos.map((orcamento) => {
            const statusInfo = statusConfig[orcamento.status] || statusConfig.Pendente;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={orcamento.id} className="transition-colors hover:bg-muted/30 border-transparent hover:border-border/50 cursor-pointer" onClick={() => onViewOrcamento(orcamento)}>
                <CardContent className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">
                            #{String(orcamento.numero_orcamento).padStart(5, "0")}
                          </span>
                          <Badge variant={statusInfo.variant} className="gap-1 text-[10px] px-1.5 py-0">
                            <StatusIcon className="h-2.5 w-2.5" />
                            {statusInfo.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                            {orcamento.cliente_nome || "Cliente não informado"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate sm:hidden">
                          {orcamento.cliente_nome || "Cliente não informado"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm font-bold text-foreground whitespace-nowrap">
                        {formatCurrency(orcamento.valor_total)}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewOrcamento(orcamento)}>
                            <Eye className="mr-2 h-4 w-4" /> Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onGeneratePdf(orcamento)}>
                            <FileDown className="mr-2 h-4 w-4" /> Baixar PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEditOrcamento(orcamento)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          {orcamento.status === "Aprovado" && (
                            <DropdownMenuItem onClick={() => handleGenerateNfe(orcamento)}>
                              <Receipt className="mr-2 h-4 w-4 text-blue-600" /> Gerar NF-e
                            </DropdownMenuItem>
                          )}
                          {orcamento.status === "Pendente" && (
                            <DropdownMenuItem onClick={() => handleOrcamentoStatusChange(orcamento, "Aprovado")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Aprovar
                            </DropdownMenuItem>
                          )}
                          {orcamento.status === "Aprovado" && (
                            <DropdownMenuItem onClick={() => handleCancelApproved(orcamento)}>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" /> Cancelar
                            </DropdownMenuItem>
                          )}
                          {orcamento.status === "Pendente" && (
                            <DropdownMenuItem onClick={() => handleOrcamentoStatusChange(orcamento, "Cancelado")}>
                              <XCircle className="mr-2 h-4 w-4 text-destructive" /> Cancelar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => { setSelectedOrcamento(orcamento); setDeleteDialogOpen(true); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">
            {filteredOrcamentos.length} resultado(s) • Página {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <Button key={page} variant={currentPage === page ? "default" : "outline"} size="icon" className="h-7 w-7 text-xs" onClick={() => setCurrentPage(page)}>
                  {page}
                </Button>
              );
            })}
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
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

      <CancelarOrcamentoModal open={cancelModalOpen} onOpenChange={setCancelModalOpen} orcamento={cancelOrcamento} />
    </div>
  );
}
