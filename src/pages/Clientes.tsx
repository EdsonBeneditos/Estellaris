import { useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClienteAccordion } from "@/components/clientes/ClienteAccordion";
import { ClienteModal } from "@/components/clientes/ClienteModal";
import { useClientesComContratos, ClienteComContratos } from "@/hooks/useClientes";

export default function Clientes() {
  const { data: clientes = [], isLoading } = useClientesComContratos();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteComContratos | null>(null);

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
      cliente.cnpj?.includes(search) ||
      cliente.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (cliente: ClienteComContratos) => {
    setEditingCliente(cliente);
    setModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setEditingCliente(null);
    }
  };

  // Estatísticas
  const totalClientes = clientes.length;
  const clientesAtivos = clientes.filter(c => c.ativo).length;
  const clientesComContrato = clientes.filter(c => 
    c.contratos.some(ct => ct.status === "Ativo")
  ).length;
  const renovacoesProximas = clientes.filter(c =>
    c.contratos.some(ct => {
      if (ct.status !== "Ativo" || !ct.data_fim) return false;
      const dias = Math.ceil(
        (new Date(ct.data_fim).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return dias <= 60 && dias > 0;
    })
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950">Clientes</h1>
          <p className="text-muted-foreground">
            Gestão de contratos e histórico de relacionamento
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-zinc-950">{totalClientes}</div>
            <p className="text-xs text-muted-foreground">Total de Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-zinc-950">{clientesComContrato}</div>
            <p className="text-xs text-muted-foreground">Com Contrato Ativo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{renovacoesProximas}</div>
            <p className="text-xs text-muted-foreground">Renovações Próximas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{clientesAtivos}</div>
            <p className="text-xs text-muted-foreground">Clientes Ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Lista de Clientes</CardTitle>
              <CardDescription>
                Clique em um cliente para expandir os detalhes
              </CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando...
            </div>
          ) : (
            <ClienteAccordion clientes={filteredClientes} onEdit={handleEdit} />
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <ClienteModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        cliente={editingCliente}
      />
    </div>
  );
}
