import { useState } from "react";
import { Plus, Pencil, Trash2, FolderOpen, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useGruposProdutos,
  useCreateGrupoProduto,
  useUpdateGrupoProduto,
  useDeleteGrupoProduto,
  useProdutosCountByGrupo,
  useProdutos,
  useDeleteProduto,
  GrupoProduto,
  Produto,
} from "@/hooks/useEstoque";
import { ProdutoModal } from "./ProdutoModal";
import { Badge } from "@/components/ui/badge";

// ── Group products view ────────────────────────────────────────────────────────
function GrupoProductsView({
  grupo,
  onBack,
}: {
  grupo: GrupoProduto;
  onBack: () => void;
}) {
  const { data: produtos = [], isLoading } = useProdutos(grupo.id);
  const deleteProduto = useDeleteProduto();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduto, setDeletingProduto] = useState<Produto | null>(null);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const handleDelete = async () => {
    if (!deletingProduto) return;
    try {
      await deleteProduto.mutateAsync(deletingProduto.id);
      toast.success("Produto excluído");
      setDeleteOpen(false);
    } catch {
      toast.error("Erro ao excluir produto");
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              {grupo.nome}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Ref: <code className="bg-muted px-1 rounded text-xs">{grupo.numero_referencia}</code>
              {" · "}{produtos.length} produto(s)
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setSelectedProduto(null);
              setIsModalOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Carregando...</div>
        ) : produtos.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum produto neste grupo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {produtos.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.nome}</p>
                    <code className="text-xs text-muted-foreground">{p.sku}</code>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium">{formatCurrency(p.preco_venda)}</span>
                  <Badge variant={p.quantidade_estoque === 0 ? "destructive" : "outline"} className="text-xs">
                    {p.quantidade_estoque} {p.unidade_medida}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setSelectedProduto(p);
                      setIsModalOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => {
                      setDeletingProduto(p);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ProdutoModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        produto={selectedProduto}
        defaultGrupoId={grupo.id}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingProduto?.nome}"? Esta ação não pode ser desfeita.
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

// ── Main GruposManager ─────────────────────────────────────────────────────────
export function GruposManager() {
  const { data: grupos = [], isLoading } = useGruposProdutos();
  const { data: countByGrupo = {} } = useProdutosCountByGrupo();
  const createGrupo = useCreateGrupoProduto();
  const updateGrupo = useUpdateGrupoProduto();
  const deleteGrupo = useDeleteGrupoProduto();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoProduto | null>(null);
  const [viewingGrupo, setViewingGrupo] = useState<GrupoProduto | null>(null);
  const [formData, setFormData] = useState({ nome: "", numero_referencia: "" });

  if (viewingGrupo) {
    return (
      <GrupoProductsView
        grupo={viewingGrupo}
        onBack={() => setViewingGrupo(null)}
      />
    );
  }

  const handleOpenCreate = () => {
    setSelectedGrupo(null);
    setFormData({ nome: "", numero_referencia: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, grupo: GrupoProduto) => {
    e.stopPropagation();
    setSelectedGrupo(grupo);
    setFormData({ nome: grupo.nome, numero_referencia: grupo.numero_referencia });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (e: React.MouseEvent, grupo: GrupoProduto) => {
    e.stopPropagation();
    setSelectedGrupo(grupo);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim() || !formData.numero_referencia.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Ensure no duplicate references
    const existing = grupos.find(
      (g) =>
        g.numero_referencia === formData.numero_referencia &&
        g.id !== selectedGrupo?.id
    );
    if (existing) {
      toast.error("Já existe um grupo com esta referência");
      return;
    }

    try {
      if (selectedGrupo) {
        await updateGrupo.mutateAsync({ id: selectedGrupo.id, ...formData });
        toast.success("Grupo atualizado com sucesso");
      } else {
        await createGrupo.mutateAsync(formData);
        toast.success("Grupo criado com sucesso");
      }
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar grupo");
    }
  };

  const handleDelete = async () => {
    if (!selectedGrupo) return;
    try {
      await deleteGrupo.mutateAsync(selectedGrupo.id);
      toast.success("Grupo excluído com sucesso");
      setIsDeleteOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao excluir grupo");
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            Grupos / Departamentos
          </CardTitle>
          <Button size="sm" onClick={handleOpenCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Grupo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            Carregando...
          </div>
        ) : grupos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <FolderOpen className="h-12 w-12 mb-2 opacity-50" />
            <p>Nenhum grupo cadastrado</p>
          </div>
        ) : (
          /* 5 cards per row; each ~4cm × 4cm (approx 64px × 112px rendered) */
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
          >
            {grupos.map((grupo) => (
              <div
                key={grupo.id}
                onClick={() => setViewingGrupo(grupo)}
                className="group relative cursor-pointer rounded-xl border border-border/60 bg-background hover:border-primary/40 hover:shadow-md hover:bg-accent/20 transition-all duration-200 flex flex-col items-center justify-center p-3 gap-1 text-center"
                style={{ height: "112px" }}
              >
                {/* Actions */}
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleOpenEdit(e, grupo)}
                    className="h-6 w-6 rounded flex items-center justify-center bg-background/80 hover:bg-accent border border-border/50 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => handleOpenDelete(e, grupo)}
                    className="h-6 w-6 rounded flex items-center justify-center bg-background/80 hover:bg-red-50 border border-border/50 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <FolderOpen className="h-7 w-7 text-primary/70 group-hover:text-primary transition-colors" />
                <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">
                  {grupo.nome}
                </p>
                <code className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">
                  {grupo.numero_referencia}
                </code>
                <span className="text-[10px] text-muted-foreground">
                  {countByGrupo[grupo.id] || 0} produto(s)
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedGrupo ? "Editar Grupo" : "Novo Grupo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Grupo</Label>
              <Input
                id="nome"
                placeholder="Ex: Peças de Reposição"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="numero_referencia">Número de Referência (código PAI)</Label>
              <Input
                id="numero_referencia"
                placeholder="Ex: GRP-001"
                value={formData.numero_referencia}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    numero_referencia: e.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Os produtos deste grupo usarão este código com sufixo (01, 02…).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createGrupo.isPending || updateGrupo.isPending}
            >
              {selectedGrupo ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo "{selectedGrupo?.nome}"?
              Esta ação não pode ser desfeita e removerá a vinculação dos produtos.
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
