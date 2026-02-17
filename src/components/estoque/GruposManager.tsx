import { useState } from "react";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useGruposProdutos,
  useCreateGrupoProduto,
  useUpdateGrupoProduto,
  useDeleteGrupoProduto,
  GrupoProduto,
} from "@/hooks/useEstoque";

export function GruposManager() {
  const { data: grupos = [], isLoading } = useGruposProdutos();
  const createGrupo = useCreateGrupoProduto();
  const updateGrupo = useUpdateGrupoProduto();
  const deleteGrupo = useDeleteGrupoProduto();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoProduto | null>(null);
  const [formData, setFormData] = useState({ nome: "", numero_referencia: "" });

  const handleOpenCreate = () => {
    setSelectedGrupo(null);
    setFormData({ nome: "", numero_referencia: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (grupo: GrupoProduto) => {
    setSelectedGrupo(grupo);
    setFormData({ nome: grupo.nome, numero_referencia: grupo.numero_referencia });
    setIsModalOpen(true);
  };

  const handleOpenDelete = (grupo: GrupoProduto) => {
    setSelectedGrupo(grupo);
    setIsDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.nome.trim() || !formData.numero_referencia.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      if (selectedGrupo) {
        await updateGrupo.mutateAsync({
          id: selectedGrupo.id,
          ...formData,
        });
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead className="w-[100px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos.map((grupo) => (
                  <TableRow key={grupo.id} className="group">
                    <TableCell className="font-medium">{grupo.nome}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {grupo.numero_referencia}
                      </code>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(grupo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(grupo)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <Label htmlFor="numero_referencia">Número de Referência</Label>
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
