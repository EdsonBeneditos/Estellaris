import { useState } from "react";
import { Plus, Trash2, ArrowRight, Users, Building2, Phone, Mail, MessageSquare, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  useFuturosLeads,
  useCreateFuturoLead,
  useDeleteFuturoLead,
  useConvertToActiveLead,
  type FuturoLead,
} from "@/hooks/useFuturosLeads";
import { useActiveOrigens } from "@/hooks/useSettings";
import { toast } from "sonner";
import { maskCNPJ, maskPhone } from "@/lib/masks";
import { SearchBar } from "@/components/leads/SearchBar";
import { format, parseISO, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function FuturosLeads() {
  const { data: futurosLeads = [], isLoading } = useFuturosLeads();
  const { data: origens = [] } = useActiveOrigens();
  const createFuturoLead = useCreateFuturoLead();
  const deleteFuturoLead = useDeleteFuturoLead();
  const convertToActiveLead = useConvertToActiveLead();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    empresa: "",
    cnpj: "",
    nome_contato: "",
    telefone: "",
    email: "",
    origem: "",
    observacoes: "",
    data_prevista_contato: new Date(),
  });

  const filteredLeads = futurosLeads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    return (
      (lead.empresa || "").toLowerCase().includes(query) ||
      (lead.nome_contato || "").toLowerCase().includes(query) ||
      (lead.email || "").toLowerCase().includes(query)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data_prevista_contato) {
      toast.error("Data prevista de contacto é obrigatória");
      return;
    }
    try {
      await createFuturoLead.mutateAsync({
        ...formData,
        data_prevista_contato: format(formData.data_prevista_contato, "yyyy-MM-dd"),
      });
      toast.success("Prospect adicionado com sucesso!");
      setFormData({
        empresa: "",
        cnpj: "",
        nome_contato: "",
        telefone: "",
        email: "",
        origem: "",
        observacoes: "",
        data_prevista_contato: new Date(),
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast.error("Erro ao adicionar prospect");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFuturoLead.mutateAsync(id);
      toast.success("Prospect removido com sucesso!");
    } catch (error) {
      toast.error("Erro ao remover prospect");
    }
  };

  const handleConvert = async (lead: FuturoLead) => {
    try {
      await convertToActiveLead.mutateAsync(lead);
      toast.success("Prospect convertido para Lead Ativo com sucesso!");
    } catch (error) {
      toast.error("Erro ao converter prospect");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Futuros Leads</h1>
          <p className="text-muted-foreground mt-1">
            Prospecção e leads em potencial para acompanhamento
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Prospect
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Prospect</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="empresa">Empresa</Label>
                  <Input
                    id="empresa"
                    value={formData.empresa}
                    onChange={(e) =>
                      setFormData({ ...formData, empresa: e.target.value })
                    }
                    placeholder="Nome da empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) =>
                      setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })
                    }
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome_contato">Nome do Contato</Label>
                  <Input
                    id="nome_contato"
                    value={formData.nome_contato}
                    onChange={(e) =>
                      setFormData({ ...formData, nome_contato: e.target.value })
                    }
                    placeholder="Nome do contato"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: maskPhone(e.target.value) })
                    }
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="email@empresa.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Select
                    value={formData.origem}
                    onValueChange={(value) =>
                      setFormData({ ...formData, origem: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {origens.map((origem) => (
                        <SelectItem key={origem.id} value={origem.nome}>
                          {origem.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data_prevista_contato">Data Prevista de Contacto *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data_prevista_contato && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {formData.data_prevista_contato ? (
                        format(formData.data_prevista_contato, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione a data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data_prevista_contato}
                      onSelect={(date) => date && setFormData({ ...formData, data_prevista_contato: date })}
                      initialFocus
                      className="p-3 pointer-events-auto"
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  placeholder="Anotações sobre este prospect..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createFuturoLead.isPending}>
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Prospects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{futurosLeads.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Buscar por empresa, contato ou email..."
      />

      {/* Prospects List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Users className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="font-medium">Nenhum prospect encontrado</p>
          <p className="text-sm mt-1">Adicione um novo prospect para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-[#003366] dark:text-blue-400">
                        {lead.empresa || "Empresa não informada"}
                      </p>
                      {lead.cnpj && (
                        <p className="text-xs text-[#4B5563] font-mono">{lead.cnpj}</p>
                      )}
                    </div>
                  </div>
                  {lead.origem && (
                    <Badge variant="secondary" className="text-xs">
                      {lead.origem}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {lead.data_prevista_contato && (
                    <div className={cn(
                      "flex items-center gap-2 text-sm px-2 py-1 rounded-md",
                      isBefore(parseISO(lead.data_prevista_contato), startOfDay(new Date()))
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary/10 text-primary"
                    )}>
                      <CalendarDays className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {format(parseISO(lead.data_prevista_contato), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                      {isBefore(parseISO(lead.data_prevista_contato), startOfDay(new Date())) && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Atrasado</Badge>
                      )}
                    </div>
                  )}
                  {lead.nome_contato && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{lead.nome_contato}</span>
                    </div>
                  )}
                  {lead.telefone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[#4B5563]">{lead.telefone}</span>
                    </div>
                  )}
                  {lead.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[#4B5563] truncate">{lead.email}</span>
                    </div>
                  )}
                  {lead.observacoes && (
                    <div className="flex items-start gap-2 text-sm">
                      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground line-clamp-2">
                        {lead.observacoes}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                  <Button
                    size="sm"
                    className="flex-1 gap-1.5"
                    onClick={() => handleConvert(lead)}
                    disabled={convertToActiveLead.isPending}
                  >
                    <ArrowRight className="h-4 w-4" />
                    Converter para Lead
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Prospect</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir "{lead.empresa || "este prospect"}"?
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(lead.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
