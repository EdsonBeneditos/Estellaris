import { useState } from "react";
import {
  Package,
  Search,
  Filter,
  Plus,
  Pencil,
  Trash2,
  MoreVertical,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { ProdutoModal } from "./ProdutoModal";
import {
  Produto,
  useProdutos,
  useDeleteProduto,
  useGruposProdutos,
} from "@/hooks/useEstoque";

const PAGE_SIZE = 20;

export function ProdutosTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [page, setPage] = useState(1);

  const { data: grupos = [] } = useGruposProdutos();
  const { data: produtos = [], isLoading } = useProdutos(
    selectedGrupo === "all" ? null : selectedGrupo
  );
  const deleteProduto = useDeleteProduto();

  const filteredProdutos = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredProdutos.length / PAGE_SIZE));
  const pagedProdutos = filteredProdutos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleEdit = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduto(null);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedProduto) return;
    try {
      await deleteProduto.mutateAsync(selectedProduto.id);
      toast.success("Produto excluído com sucesso");
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir produto");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Produtos
          </CardTitle>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou SKU..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedGrupo || "all"}
              onValueChange={(v) => setSelectedGrupo(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos</SelectItem>
                {grupos.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Carregando produtos...
          </div>
        ) : filteredProdutos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
            <p className="text-sm">
              {searchTerm
                ? "Tente uma busca diferente"
                : "Clique em 'Novo Produto' para começar"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              {filteredProdutos.length} produto(s) encontrado(s)
              {totalPages > 1 && ` — Página ${page} de ${totalPages}`}
            </p>

            {/* Desktop Table */}
            <div className="hidden md:block max-h-[500px] overflow-auto relative">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Produto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead className="text-right">Venda</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedProdutos.map((produto) => (
                    <TableRow key={produto.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0">
                            <Package className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">{produto.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {produto.unidade_medida}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {produto.sku}
                        </code>
                      </TableCell>
                      <TableCell>
                        {produto.grupo ? (
                          <Badge variant="outline" className="font-normal">
                            {produto.grupo.nome}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(produto.preco_custo)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatCurrency(produto.preco_venda)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {produto.quantidade_estoque <= 5 && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          <Badge
                            variant={
                              produto.quantidade_estoque === 0
                                ? "destructive"
                                : produto.quantidade_estoque <= 5
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {produto.quantidade_estoque}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(produto)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(produto)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {pagedProdutos.map((produto) => (
                <div
                  key={produto.id}
                  className="p-4 rounded-xl border border-border/50 bg-background/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary shrink-0">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{produto.nome}</p>
                        <code className="text-xs bg-muted px-2 py-0.5 rounded">
                          {produto.sku}
                        </code>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(produto)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(produto)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Custo</p>
                      <p className="font-mono">{formatCurrency(produto.preco_custo)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Venda</p>
                      <p className="font-mono font-medium">
                        {formatCurrency(produto.preco_venda)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Estoque</p>
                      <div className="flex items-center gap-1">
                        {produto.quantidade_estoque <= 5 && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                        <Badge
                          variant={
                            produto.quantidade_estoque === 0
                              ? "destructive"
                              : produto.quantidade_estoque <= 5
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {produto.quantidade_estoque} {produto.unidade_medida}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {produto.grupo && (
                    <div className="mt-2">
                      <Badge variant="outline" className="font-normal text-xs">
                        {produto.grupo.nome}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Product Modal */}
      <ProdutoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        produto={selectedProduto}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{selectedProduto?.nome}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
