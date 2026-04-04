import { useState } from "react";
import { Landmark, Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useCentrosCusto,
  useCreateCentroCusto,
  useUpdateCentroCusto,
  useDeleteCentroCusto,
} from "@/hooks/useCentrosCusto";
import { toast } from "sonner";

export function CentrosCustoManager() {
  const { data: centrosCusto = [], isLoading } = useCentrosCusto();
  const createCentroCusto = useCreateCentroCusto();
  const updateCentroCusto = useUpdateCentroCusto();
  const deleteCentroCusto = useDeleteCentroCusto();

  const [newItem, setNewItem] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setIsAdding(true);
    try {
      await createCentroCusto.mutateAsync(newItem.trim());
      setNewItem("");
      toast.success("Centro de Custo adicionado!");
    } catch (error: any) {
      if (error?.message?.includes("duplicate")) {
        toast.error("Este centro de custo já existe!");
      } else {
        toast.error("Erro ao adicionar centro de custo");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCentroCusto.mutateAsync(id);
      toast.success("Centro de custo removido!");
    } catch (error) {
      toast.error("Erro ao remover centro de custo");
    }
  };

  const handleStartEdit = (id: string, nome: string) => {
    setEditingId(id);
    setEditingName(nome);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await updateCentroCusto.mutateAsync({ id: editingId, nome: editingName.trim() });
      toast.success("Centro de custo atualizado!");
      setEditingId(null);
      setEditingName("");
    } catch (error) {
      toast.error("Erro ao atualizar centro de custo");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5 text-primary" />
          Centros de Custo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Gerencie os centros de custo para categorizar despesas
        </p>

        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            placeholder="Nome do centro de custo"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={!newItem.trim() || isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Items list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : centrosCusto.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum centro de custo cadastrado
            </p>
          ) : (
            centrosCusto.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/50 border-border transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:bg-primary/[0.02]"
              >
                {editingId === item.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") handleCancelEdit();
                      }}
                      autoFocus
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                        {item.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{item.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleStartEdit(item.id, item.nome)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover "{item.nome}"? Esta
                              ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
