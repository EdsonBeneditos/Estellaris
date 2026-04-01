import { useState } from "react";
import {
  Users,
  Briefcase,
  Settings,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Building2,
  Landmark,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useUpdateVendedorColor,
  useCreateTipoServico,
  useDeleteTipoServico,
  useToggleTipoServico,
  useUpdateTipoServicoColor,
  useCreateOrigem,
  useDeleteOrigem,
  useToggleOrigem,
  useUpdateOrigemColor,
} from "@/hooks/useSettings";
import { useColaboradores } from "@/hooks/useColaboradores";
import { ColorPicker } from "@/components/settings/ColorPicker";
import { OrganizationSettings } from "@/components/settings/OrganizationSettings";
import { CentrosCustoManager } from "@/components/settings/CentrosCustoManager";
import { ConfiguracaoFiscal } from "@/components/settings/ConfiguracaoFiscal";
import { toast } from "sonner";

interface SettingsListProps {
  title: string;
  icon: React.ElementType;
  items: Array<{ id: string; nome: string; ativo: boolean; cor: string | null }>;
  isLoading: boolean;
  onAdd: (nome: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onToggle: (id: string, ativo: boolean) => Promise<unknown>;
  onColorChange: (id: string, cor: string) => Promise<unknown>;
  placeholder: string;
  description: string;
  defaultColor: string;
}

function SettingsList({
  title,
  icon: Icon,
  items,
  isLoading,
  onAdd,
  onDelete,
  onToggle,
  onColorChange,
  placeholder,
  description,
  defaultColor,
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

  const handleColorChange = async (id: string, cor: string) => {
    try {
      await onColorChange(id, cor);
      toast.success("Cor atualizada!");
    } catch (error) {
      toast.error("Erro ao atualizar cor");
    }
  };

  return (
    <Card className="relative overflow-visible transition-all duration-200 hover:shadow-lg hover:border-primary/30">
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
                className={`flex items-center justify-between p-3 rounded-lg border border-transparent transition-colors duration-200 hover:border-primary/30 hover:bg-muted/70 ${
                  item.ativo
                    ? "bg-muted/50"
                    : "bg-muted/20 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{ backgroundColor: item.cor || defaultColor }}
                  >
                    {item.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className={item.ativo ? "font-medium" : "font-medium text-muted-foreground"}>
                    {item.nome}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ColorPicker
                    value={item.cor || defaultColor}
                    onChange={(cor) => handleColorChange(item.id, cor)}
                  />
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
  const updateVendedorColor = useUpdateVendedorColor();

  const createTipoServico = useCreateTipoServico();
  const deleteTipoServico = useDeleteTipoServico();
  const toggleTipoServico = useToggleTipoServico();
  const updateTipoServicoColor = useUpdateTipoServicoColor();

  const createOrigem = useCreateOrigem();
  const deleteOrigem = useDeleteOrigem();
  const toggleOrigem = useToggleOrigem();
  const updateOrigemColor = useUpdateOrigemColor();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie a organização, vendedores, serviços, origens e centros de custo
        </p>
      </div>

      <Tabs defaultValue="organizacao" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="organizacao" className="gap-2">
            <Building2 className="h-4 w-4" />
            Organização
          </TabsTrigger>
          <TabsTrigger value="equipe" className="gap-2">
            <Settings className="h-4 w-4" />
            Equipe & Leads
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <Landmark className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="gap-2">
            <FileText className="h-4 w-4" />
            Fiscal / NF-e
          </TabsTrigger>
        </TabsList>

        <TabsContent value="organizacao" className="mt-6">
          <OrganizationSettings />
        </TabsContent>

        <TabsContent value="equipe" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SettingsList
              title="Vendedores"
              icon={Users}
              items={vendedores}
              isLoading={vendedoresLoading}
              onAdd={(nome) => createVendedor.mutateAsync(nome)}
              onDelete={(id) => deleteVendedor.mutateAsync(id)}
              onToggle={(id, ativo) => toggleVendedor.mutateAsync({ id, ativo })}
              onColorChange={(id, cor) => updateVendedorColor.mutateAsync({ id, cor })}
              placeholder="Nome do vendedor"
              description="Equipe comercial cadastrada no sistema"
              defaultColor="#10B981"
            />

            <SettingsList
              title="Tipos de Serviço"
              icon={Briefcase}
              items={tiposServico}
              isLoading={tiposLoading}
              onAdd={(nome) => createTipoServico.mutateAsync(nome)}
              onDelete={(id) => deleteTipoServico.mutateAsync(id)}
              onToggle={(id, ativo) => toggleTipoServico.mutateAsync({ id, ativo })}
              onColorChange={(id, cor) => updateTipoServicoColor.mutateAsync({ id, cor })}
              placeholder="Nome do serviço"
              description="Serviços oferecidos pela empresa"
              defaultColor="#8B5CF6"
            />

            <SettingsList
              title="Origens de Lead"
              icon={Settings}
              items={origens}
              isLoading={origensLoading}
              onAdd={(nome) => createOrigem.mutateAsync(nome)}
              onDelete={(id) => deleteOrigem.mutateAsync(id)}
              onToggle={(id, ativo) => toggleOrigem.mutateAsync({ id, ativo })}
              onColorChange={(id, cor) => updateOrigemColor.mutateAsync({ id, cor })}
              placeholder="Nome da origem"
              description="Canais de captação de leads configurados"
              defaultColor="#3B82F6"
            />
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CentrosCustoManager />
          </div>
        </TabsContent>

        <TabsContent value="fiscal" className="mt-6">
          <ConfiguracaoFiscal />
        </TabsContent>
      </Tabs>
    </div>
  );
}
