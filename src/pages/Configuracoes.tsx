import { useState } from "react";
import {
  Users,
  Briefcase,
  Settings,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  useVendedores,
  useTiposServico,
  useOrigens,
  useCreateVendedor,
  useDeleteVendedor,
  useToggleVendedor,
  useCreateTipoServico,
  useDeleteTipoServico,
  useToggleTipoServico,
  useCreateOrigem,
  useDeleteOrigem,
  useToggleOrigem,
} from "@/hooks/useSettings";
import { toast } from "sonner";

interface SettingsListProps {
  title: string;
  icon: React.ElementType;
  items: Array<{ id: string; nome: string; ativo: boolean }>;
  isLoading: boolean;
  onAdd: (nome: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onToggle: (id: string, ativo: boolean) => Promise<unknown>;
  placeholder: string;
  description: string;
}

function SettingsList({
  title,
  icon: Icon,
  items,
  isLoading,
  onAdd,
  onDelete,
  onToggle,
  placeholder,
  description,
}: SettingsListProps) {
  const [newItem, setNewItem] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setIsAdding(true);
    try {
      await onAdd(newItem.trim());
      setNewItem("");
      toast.success("Item adicionado com sucesso!");
    } catch (error: any) {
      if (error?.message?.includes("duplicate")) {
        toast.error("Este item já existe!");
      } else {
        toast.error("Erro ao adicionar item");
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast.success("Item removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover item");
    }
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      await onToggle(id, !currentStatus);
      toast.success(
        currentStatus ? "Item desativado" : "Item ativado"
      );
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>

        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            placeholder={placeholder}
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
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Items list */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum item cadastrado
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  item.ativo
                    ? "bg-muted/50 border-border"
                    : "bg-muted/20 border-border/50 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      item.ativo
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {item.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className={item.ativo ? "font-medium" : "font-medium text-muted-foreground"}>
                    {item.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={item.ativo ? "secondary" : "outline"}
                    className="text-xs"
                  >
                    {item.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleToggle(item.id, item.ativo)}
                  >
                    {item.ativo ? (
                      <ToggleRight className="h-4 w-4 text-primary" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                    )}
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
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  const { data: vendedores = [], isLoading: vendedoresLoading } = useVendedores();
  const { data: tiposServico = [], isLoading: tiposLoading } = useTiposServico();
  const { data: origens = [], isLoading: origensLoading } = useOrigens();

  const createVendedor = useCreateVendedor();
  const deleteVendedor = useDeleteVendedor();
  const toggleVendedor = useToggleVendedor();

  const createTipoServico = useCreateTipoServico();
  const deleteTipoServico = useDeleteTipoServico();
  const toggleTipoServico = useToggleTipoServico();

  const createOrigem = useCreateOrigem();
  const deleteOrigem = useDeleteOrigem();
  const toggleOrigem = useToggleOrigem();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie vendedores, serviços e origens de leads
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingsList
          title="Vendedores"
          icon={Users}
          items={vendedores}
          isLoading={vendedoresLoading}
          onAdd={(nome) => createVendedor.mutateAsync(nome)}
          onDelete={(id) => deleteVendedor.mutateAsync(id)}
          onToggle={(id, ativo) => toggleVendedor.mutateAsync({ id, ativo })}
          placeholder="Nome do vendedor"
          description="Equipe comercial cadastrada no sistema"
        />

        <SettingsList
          title="Tipos de Serviço"
          icon={Briefcase}
          items={tiposServico}
          isLoading={tiposLoading}
          onAdd={(nome) => createTipoServico.mutateAsync(nome)}
          onDelete={(id) => deleteTipoServico.mutateAsync(id)}
          onToggle={(id, ativo) => toggleTipoServico.mutateAsync({ id, ativo })}
          placeholder="Nome do serviço"
          description="Serviços ambientais oferecidos pela Acqua Nobilis"
        />

        <SettingsList
          title="Origens de Lead"
          icon={Settings}
          items={origens}
          isLoading={origensLoading}
          onAdd={(nome) => createOrigem.mutateAsync(nome)}
          onDelete={(id) => deleteOrigem.mutateAsync(id)}
          onToggle={(id, ativo) => toggleOrigem.mutateAsync({ id, ativo })}
          placeholder="Nome da origem"
          description="Canais de captação de leads configurados"
        />
      </div>
    </div>
  );
}
