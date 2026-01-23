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
  Clock,
  FileDown,
  Calendar,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useNotasFiscais, useDeleteNotaFiscal, useUpdateNotaFiscal, NotaFiscal } from "@/hooks/useNotasFiscais";

interface NotasFiscaisListProps {
  onNewNota: () => void;
  onEditNota: (nota: NotaFiscal) => void;
  onViewNota: (nota: NotaFiscal) => void;
  onGeneratePdf: (nota: NotaFiscal) => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ComponentType<{ className?: string }> }> = {
  Rascunho: { label: "Rascunho", variant: "secondary", icon: Clock },
  Pendente: { label: "Pendente", variant: "outline", icon: Clock },
  Autorizada: { label: "Autorizada", variant: "default", icon: CheckCircle },
};

export function NotasFiscaisList({ onNewNota, onEditNota, onViewNota, onGeneratePdf }: NotasFiscaisListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNota, setSelectedNota] = useState<NotaFiscal | null>(null);

  const { data: notas, isLoading } = useNotasFiscais();
  const { mutate: deleteNota } = useDeleteNotaFiscal();
  const { mutate: updateNota } = useUpdateNotaFiscal();

  const filteredNotas = notas?.filter((nota) => {
    const matchesSearch =
      nota.destinatario_nome?.toLowerCase().includes(search.toLowerCase()) ||
      nota.numero_nota.toString().includes(search) ||
      nota.destinatario_cnpj?.includes(search) ||
      nota.chave_acesso?.includes(search);
    
    const matchesStatus = statusFilter === "all" || nota.status === statusFilter;
    
    const matchesDate = !dateFilter || 
      format(new Date(nota.data_emissao), "yyyy-MM-dd") === format(dateFilter, "yyyy-MM-dd");
    
    return matchesSearch && matchesStatus && matchesDate;
  }) || [];

  const handleDelete = () => {
    if (selectedNota) {
      deleteNota(selectedNota.id);
      setDeleteDialogOpen(false);
      setSelectedNota(null);
    }
  };

  const handleStatusChange = (nota: NotaFiscal, newStatus: string) => {
    updateNota({ id: nota.id, data: { status: newStatus } });
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Notas Fiscais</h2>
          <p className="text-muted-foreground">Gerencie suas notas fiscais eletrônicas</p>
        </div>
        <Button onClick={onNewNota} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Nota Manual
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, nº nota, CNPJ ou chave..."
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
                <SelectItem value="Rascunho">Rascunho</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Autorizada">Autorizada</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateFilter ? format(dateFilter, "dd/MM/yyyy") : "Data Emissão"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
                {dateFilter && (
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full" onClick={() => setDateFilter(undefined)}>
                      Limpar filtro
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredNotas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground">Nenhuma nota fiscal encontrada</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || statusFilter !== "all" || dateFilter
                ? "Tente ajustar os filtros"
                : "Clique em 'Nova Nota Manual' para criar uma"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotas.map((nota) => {
            const statusInfo = statusConfig[nota.status] || statusConfig.Rascunho;
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={nota.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            NF-e #{String(nota.numero_nota).padStart(6, "0")}
                          </span>
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {nota.destinatario_nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Emissão: {format(new Date(nota.data_emissao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {nota.chave_acesso && (
                            <span className="ml-2 font-mono text-[10px]">
                              Chave: {nota.chave_acesso.substring(0, 20)}...
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-foreground">
                          {formatCurrency(nota.valor_total)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Produtos: {formatCurrency(nota.valor_produtos)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewNota(nota)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizar DANFE
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onGeneratePdf(nota)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Baixar PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onEditNota(nota)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {nota.status === "Rascunho" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(nota, "Pendente")}>
                              <Clock className="mr-2 h-4 w-4 text-amber-600" />
                              Marcar Pendente
                            </DropdownMenuItem>
                          )}
                          {nota.status === "Pendente" && (
                            <DropdownMenuItem onClick={() => handleStatusChange(nota, "Autorizada")}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              Marcar Autorizada
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedNota(nota);
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
            <AlertDialogTitle>Excluir Nota Fiscal</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a NF-e #{selectedNota?.numero_nota}? Esta ação não pode ser desfeita.
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
