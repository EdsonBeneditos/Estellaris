import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter, Search } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

interface FiltrosMovimentacoesProps {
  filtros: {
    dataInicio: string;
    dataFim: string;
    formaPagamento: string;
    tipo: string;
    busca: string;
  };
  onFiltrosChange: (filtros: {
    dataInicio: string;
    dataFim: string;
    formaPagamento: string;
    tipo: string;
    busca: string;
  }) => void;
}

const formasPagamento = [
  { value: "todos", label: "Todas" },
  { value: "Dinheiro", label: "Dinheiro" },
  { value: "Pix", label: "Pix" },
  { value: "Cartão Débito", label: "Cartão Débito" },
  { value: "Cartão Crédito", label: "Cartão Crédito" },
  { value: "Boleto", label: "Boleto" },
  { value: "Transferência", label: "Transferência" },
];

export function FiltrosMovimentacoes({ filtros, onFiltrosChange }: FiltrosMovimentacoesProps) {
  const setQuickFilter = (periodo: "hoje" | "semana" | "mes") => {
    const now = new Date();
    let inicio: Date;
    let fim: Date;

    switch (periodo) {
      case "hoje":
        inicio = startOfDay(now);
        fim = endOfDay(now);
        break;
      case "semana":
        inicio = startOfWeek(now, { weekStartsOn: 0 });
        fim = endOfWeek(now, { weekStartsOn: 0 });
        break;
      case "mes":
        inicio = startOfMonth(now);
        fim = endOfMonth(now);
        break;
    }

    onFiltrosChange({
      ...filtros,
      dataInicio: format(inicio, "yyyy-MM-dd"),
      dataFim: format(fim, "yyyy-MM-dd"),
    });
  };

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por descrição, categoria ou usuário..."
          className="pl-10"
          value={filtros.busca}
          onChange={(e) => onFiltrosChange({ ...filtros, busca: e.target.value })}
        />
      </div>

      {/* Quick filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickFilter("hoje")}
          className="text-xs"
        >
          <Calendar className="h-3 w-3 mr-1" />
          Hoje
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickFilter("semana")}
          className="text-xs"
        >
          Esta Semana
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setQuickFilter("mes")}
          className="text-xs"
        >
          Este Mês
        </Button>
      </div>

      {/* Filtros detalhados */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Data Início</Label>
          <Input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) =>
              onFiltrosChange({ ...filtros, dataInicio: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Data Fim</Label>
          <Input
            type="date"
            value={filtros.dataFim}
            onChange={(e) =>
              onFiltrosChange({ ...filtros, dataFim: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Forma de Pagamento</Label>
          <Select
            value={filtros.formaPagamento}
            onValueChange={(value) =>
              onFiltrosChange({ ...filtros, formaPagamento: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formasPagamento.map((forma) => (
                <SelectItem key={forma.value} value={forma.value}>
                  {forma.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Tipo</Label>
          <Select
            value={filtros.tipo}
            onValueChange={(value) =>
              onFiltrosChange({ ...filtros, tipo: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="Entrada">Entradas</SelectItem>
              <SelectItem value="Saída">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
