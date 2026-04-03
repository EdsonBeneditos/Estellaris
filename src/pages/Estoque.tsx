import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, FolderOpen } from "lucide-react";
import { GruposManager } from "@/components/estoque/GruposManager";
import { ProdutosTable } from "@/components/estoque/ProdutosTable";

export default function Estoque() {
  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Estoque / Cadastro</h1>
        <p className="text-muted-foreground">
          Gerencie seus produtos, grupos e controle de estoque
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="grupos" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="grupos" className="gap-2">
            <FolderOpen className="h-4 w-4" />
            Grupos
          </TabsTrigger>
          <TabsTrigger value="produtos" className="gap-2">
            <Package className="h-4 w-4" />
            Produtos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grupos" className="mt-6">
          <GruposManager />
        </TabsContent>

        <TabsContent value="produtos" className="mt-6">
          <ProdutosTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
