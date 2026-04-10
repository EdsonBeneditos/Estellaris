import { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Orcamento, OrcamentoItem } from "@/hooks/useOrcamentos";
import logo from "@/assets/logo.png";

interface OrcamentoPreviewProps {
  orcamento: Orcamento;
  items: OrcamentoItem[];
  orgData?: {
    nome?: string;
    cnpj?: string;
    logo_url?: string;
    orcamento_cabecalho?: string;
    orcamento_rodape?: string;
  } | null;
}

export const OrcamentoPreview = forwardRef<HTMLDivElement, OrcamentoPreviewProps>(
  ({ orcamento, items, orgData }, ref) => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    const statusLabels: Record<string, string> = {
      Pendente: "ORÇAMENTO",
      Aprovado: "VENDA APROVADA",
      Cancelado: "CANCELADO",
    };

    return (
      <div
        ref={ref}
        className="mx-auto w-full max-w-[210mm] bg-white text-slate-900"
        style={{ minHeight: "297mm", padding: "16mm 14mm" }}
      >
        {/* Custom Header Text */}
        {orgData?.orcamento_cabecalho && (
          <div className="mb-4 text-center text-sm text-slate-600 whitespace-pre-wrap">
            {orgData.orcamento_cabecalho}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex items-start justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <img src={orgData?.logo_url || logo} alt="Logo" className="h-16 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">{orgData?.nome || "Estellaris"}</h1>
              {orgData?.cnpj && <p className="text-sm text-slate-600">CNPJ: {orgData.cnpj}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="inline-block rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
              {statusLabels[orcamento.status] || "ORÇAMENTO"}
            </div>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              #{String(orcamento.numero_orcamento).padStart(5, "0")}
            </p>
            <p className="text-sm text-slate-600">
              Emissão: {format(new Date(orcamento.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </p>
            {orcamento.data_validade && (
              <p className="text-sm text-slate-600">
                Válido até: {format(new Date(orcamento.data_validade), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-8 rounded-lg bg-slate-50 p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Dados do Cliente
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Nome / Razão Social</p>
              <p className="font-medium text-slate-900">
                {orcamento.cliente_nome || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">CNPJ / CPF</p>
              <p className="font-medium text-slate-900">
                {orcamento.cliente_cnpj || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Telefone</p>
              <p className="font-medium text-slate-900">
                {orcamento.cliente_telefone || "Não informado"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Email</p>
              <p className="font-medium text-slate-900">
                {orcamento.cliente_email || "Não informado"}
              </p>
            </div>
            {orcamento.cliente_endereco && (
              <div className="sm:col-span-2">
                <p className="text-xs text-slate-500">Endereço</p>
                <p className="font-medium text-slate-900">{orcamento.cliente_endereco}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Produtos / Serviços
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Descrição
                </th>
                <th className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Qtd
                </th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Valor Unit.
                </th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Desc.
                </th>
                <th className="py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-slate-50" : ""}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-slate-900">{item.produto_nome}</p>
                    <p className="text-xs text-slate-500">SKU: {item.produto_sku}</p>
                  </td>
                  <td className="py-3 text-center text-slate-700">
                    {item.quantidade} {item.unidade_medida}
                  </td>
                  <td className="py-3 text-right text-slate-700">
                    {formatCurrency(item.preco_unitario)}
                  </td>
                  <td className="py-3 text-right text-slate-700">
                    {item.desconto_percentual > 0 ? `${item.desconto_percentual}%` : "-"}
                  </td>
                  <td className="py-3 text-right font-semibold text-slate-900">
                    {formatCurrency(item.valor_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-8 flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal:</span>
              <span className="text-slate-900">{formatCurrency(orcamento.subtotal)}</span>
            </div>
            {orcamento.desconto_total > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Descontos:</span>
                <span className="text-red-600">-{formatCurrency(orcamento.desconto_total)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-slate-900 pt-2 text-xl font-bold">
              <span className="text-slate-900">Total:</span>
              <span className="text-slate-900">{formatCurrency(orcamento.valor_total)}</span>
            </div>
          </div>
        </div>

        {/* Observations */}
        {orcamento.observacoes && (
          <div className="mb-8 rounded-lg border border-slate-200 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Observações
            </h3>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{orcamento.observacoes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto border-t border-slate-200 pt-6 text-center text-xs text-slate-500">
          {orgData?.orcamento_rodape ? (
            <p className="whitespace-pre-wrap">{orgData.orcamento_rodape}</p>
          ) : (
            <>
              <p>Este documento não possui valor fiscal. Documento gerado eletronicamente.</p>
              <p className="mt-1">{orgData?.nome || "Estellaris"}</p>
            </>
          )}
        </div>
      </div>
    );
  }
);

OrcamentoPreview.displayName = "OrcamentoPreview";
