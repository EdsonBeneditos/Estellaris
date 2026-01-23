import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategorias, useCreateMovimentacao, useUpdateMovimentacao, MovimentacaoCaixa } from "@/hooks/useFinanceiro";
import { useAuthContext } from "@/contexts/AuthContext";

interface MovimentacaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movimentacao?: MovimentacaoCaixa | null;
  caixaId?: string | null;
}

const formasPagamento = [
  "Dinheiro",
  "Pix",
  "Cartão Débito",
  "Cartão Crédito",
  "Boleto",
  "Transferência",
];

export function MovimentacaoModal({
  open,
  onOpenChange,
  movimentacao,
  caixaId,
}: MovimentacaoModalProps) {
  const { user } = useAuthContext();
  const { data: categorias } = useCategorias();
  const createMovimentacao = useCreateMovimentacao();
  const updateMovimentacao = useUpdateMovimentacao();

  const [tipo, setTipo] = useState<"Entrada" | "Saída">("Entrada");
  const [valor, setValor] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("Dinheiro");
  const [descricao, setDescricao] = useState("");

  const isEditing = !!movimentacao;

  useEffect(() => {
    if (movimentacao) {
      setTipo(movimentacao.tipo);
      setValor(String(movimentacao.valor));
      setCategoriaId(movimentacao.categoria_id || "");
      setFormaPagamento(movimentacao.forma_pagamento);
      setDescricao(movimentacao.descricao || "");
    } else {
      setTipo("Entrada");
      setValor("");
      setCategoriaId("");
      setFormaPagamento("Dinheiro");
      setDescricao("");
    }
  }, [movimentacao, open]);

  const categoriasFiltradas = categorias?.filter((c) => c.tipo === tipo) || [];

  const handleSubmit = async () => {
    const categoriaSelecionada = categorias?.find((c) => c.id === categoriaId);

    const data = {
      tipo,
      valor: Number(valor) || 0,
      categoria_id: categoriaId || null,
      categoria_nome: categoriaSelecionada?.nome || null,
      forma_pagamento: formaPagamento,
      descricao: descricao || null,
      usuario_email: user?.email || null,
      caixa_id: caixaId || null,
      data_hora: new Date().toISOString(),
      orcamento_id: null,
    };

    if (isEditing) {
      await updateMovimentacao.mutateAsync({ id: movimentacao.id, ...data });
    } else {
      await createMovimentacao.mutateAsync(data);
    }

    onOpenChange(false);
  };

  const isPending = createMovimentacao.isPending || updateMovimentacao.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Movimentação" : "Nova Movimentação"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo */}
          <Tabs value={tipo} onValueChange={(v) => setTipo(v as "Entrada" | "Saída")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="Entrada" className="data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-600">
                Entrada
              </TabsTrigger>
              <TabsTrigger value="Saída" className="data-[state=active]:bg-red-500/10 data-[state=active]:text-red-600">
                Saída
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Valor */}
          <div className="space-y-2">
            <Label htmlFor="valor">Valor (R$) *</Label>
            <Input
              id="valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Select value={categoriaId} onValueChange={setCategoriaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasFiltradas.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="forma-pagamento">Forma de Pagamento</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma} value={forma}>
                    {forma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Detalhes da movimentação..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !valor}>
            {isPending ? "Salvando..." : isEditing ? "Salvar" : "Registrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
