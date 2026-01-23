import { forwardRef } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotaFiscal, NotaFiscalItem } from "@/hooks/useNotasFiscais";
import logo from "@/assets/logo.png";

interface DanfePreviewProps {
  nota: NotaFiscal;
  itens: NotaFiscalItem[];
}

export const DanfePreview = forwardRef<HTMLDivElement, DanfePreviewProps>(
  ({ nota, itens }, ref) => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    // Gerar chave de acesso placeholder
    const chaveAcesso = nota.chave_acesso || "0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000";

    return (
      <div
        ref={ref}
        className="danfe-preview mx-auto bg-white text-black"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "10mm",
          fontFamily: "Arial, sans-serif",
          fontSize: "9px",
          lineHeight: "1.3",
        }}
      >
        {/* Cabeçalho */}
        <div className="border-2 border-black">
          {/* Linha 1 - Logo, Identificação e Código de Barras */}
          <div className="flex border-b-2 border-black">
            {/* Logo e dados do emitente */}
            <div className="flex-1 border-r-2 border-black p-2">
              <div className="flex items-start gap-4">
                <img src={logo} alt="Logo" className="h-16 w-auto object-contain" />
                <div className="flex-1">
                  <p className="text-sm font-bold">{nota.emitente_razao_social}</p>
                  <p className="text-[8px]">{nota.emitente_endereco}</p>
                  <p className="text-[8px]">{nota.emitente_cidade} - {nota.emitente_uf} - CEP: {nota.emitente_cep}</p>
                  <p className="text-[8px]">CNPJ: {nota.emitente_cnpj} - IE: {nota.emitente_ie}</p>
                </div>
              </div>
            </div>
            {/* DANFE */}
            <div className="w-32 border-r-2 border-black p-2 text-center">
              <p className="text-lg font-bold">DANFE</p>
              <p className="text-[7px]">Documento Auxiliar da</p>
              <p className="text-[7px]">Nota Fiscal Eletrônica</p>
              <div className="mt-2 border border-black p-1">
                <p className="text-[8px]">0 - ENTRADA</p>
                <p className="text-[8px] font-bold">1 - SAÍDA</p>
              </div>
              <p className="mt-2 text-lg font-bold">
                Nº {String(nota.numero_nota).padStart(9, "0")}
              </p>
              <p className="text-[8px]">Série 001</p>
              <p className="text-[8px]">Folha 1/1</p>
            </div>
            {/* Código de barras */}
            <div className="w-64 p-2">
              <div className="mb-2 h-12 bg-[repeating-linear-gradient(90deg,black,black_2px,white_2px,white_4px)]" />
              <p className="text-center font-mono text-[8px]">{chaveAcesso}</p>
              <div className="mt-2 border border-black p-1 text-center">
                <p className="text-[8px] font-bold">Consulta de autenticidade no portal nacional da NF-e</p>
                <p className="text-[7px]">www.nfe.fazenda.gov.br/portal</p>
              </div>
            </div>
          </div>

          {/* Natureza da Operação */}
          <div className="flex border-b-2 border-black">
            <div className="flex-1 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">NATUREZA DA OPERAÇÃO</p>
              <p className="text-[9px] font-semibold">{nota.natureza_operacao}</p>
            </div>
            <div className="w-40 p-1">
              <p className="text-[7px] text-gray-600">PROTOCOLO DE AUTORIZAÇÃO DE USO</p>
              <p className="text-[8px] font-mono">
                {nota.status === "Autorizada" ? "123456789012345 - " + format(new Date(), "dd/MM/yyyy HH:mm:ss") : "NOTA EM RASCUNHO"}
              </p>
            </div>
          </div>

          {/* Inscrição Estadual */}
          <div className="flex border-b-2 border-black">
            <div className="flex-1 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">INSCRIÇÃO ESTADUAL</p>
              <p className="text-[9px]">{nota.emitente_ie}</p>
            </div>
            <div className="flex-1 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">INSCRIÇÃO ESTADUAL DO SUBST. TRIB.</p>
              <p className="text-[9px]">-</p>
            </div>
            <div className="flex-1 p-1">
              <p className="text-[7px] text-gray-600">CNPJ</p>
              <p className="text-[9px]">{nota.emitente_cnpj}</p>
            </div>
          </div>

          {/* Destinatário/Remetente */}
          <div className="border-b-2 border-black bg-gray-100 p-1">
            <p className="text-[9px] font-bold">DESTINATÁRIO / REMETENTE</p>
          </div>

          <div className="flex border-b-2 border-black">
            <div className="flex-1 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">NOME / RAZÃO SOCIAL</p>
              <p className="text-[9px] font-semibold">{nota.destinatario_nome}</p>
            </div>
            <div className="w-40 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">CNPJ / CPF</p>
              <p className="text-[9px]">{nota.destinatario_cnpj || "-"}</p>
            </div>
            <div className="w-32 p-1">
              <p className="text-[7px] text-gray-600">DATA EMISSÃO</p>
              <p className="text-[9px]">{format(new Date(nota.data_emissao), "dd/MM/yyyy")}</p>
            </div>
          </div>

          <div className="flex border-b-2 border-black">
            <div className="flex-1 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">ENDEREÇO</p>
              <p className="text-[9px]">{nota.destinatario_endereco || "-"}</p>
            </div>
            <div className="w-32 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">BAIRRO / DISTRITO</p>
              <p className="text-[9px]">-</p>
            </div>
            <div className="w-24 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">CEP</p>
              <p className="text-[9px]">{nota.destinatario_cep || "-"}</p>
            </div>
            <div className="w-32 p-1">
              <p className="text-[7px] text-gray-600">DATA SAÍDA/ENTRADA</p>
              <p className="text-[9px]">
                {nota.data_saida ? format(new Date(nota.data_saida), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")}
              </p>
            </div>
          </div>

          <div className="flex border-b-2 border-black">
            <div className="flex-1 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">MUNICÍPIO</p>
              <p className="text-[9px]">{nota.destinatario_cidade || "-"}</p>
            </div>
            <div className="w-16 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">UF</p>
              <p className="text-[9px]">{nota.destinatario_uf || "-"}</p>
            </div>
            <div className="w-32 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">FONE / FAX</p>
              <p className="text-[9px]">{nota.destinatario_telefone || "-"}</p>
            </div>
            <div className="w-40 border-r-2 border-black p-1">
              <p className="text-[7px] text-gray-600">INSCRIÇÃO ESTADUAL</p>
              <p className="text-[9px]">{nota.destinatario_ie || "-"}</p>
            </div>
            <div className="w-24 p-1">
              <p className="text-[7px] text-gray-600">HORA SAÍDA</p>
              <p className="text-[9px]">{format(new Date(), "HH:mm:ss")}</p>
            </div>
          </div>

          {/* Cálculo do Imposto */}
          <div className="border-b-2 border-black bg-gray-100 p-1">
            <p className="text-[9px] font-bold">CÁLCULO DO IMPOSTO</p>
          </div>

          <div className="flex border-b-2 border-black">
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">BASE DE CÁLCULO DO ICMS</p>
              <p className="text-[9px] font-semibold">{formatCurrency(nota.base_calculo_icms || 0)}</p>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">VALOR DO ICMS</p>
              <p className="text-[9px] font-semibold">{formatCurrency(nota.valor_icms || 0)}</p>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">BASE CÁLC. ICMS S.T.</p>
              <p className="text-[9px]">{formatCurrency(nota.base_calculo_icms_st || 0)}</p>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">VALOR DO ICMS SUBST.</p>
              <p className="text-[9px]">{formatCurrency(nota.valor_icms_st || 0)}</p>
            </div>
            <div className="flex-1 p-1">
              <p className="text-[7px] text-gray-600">VALOR TOTAL DOS PRODUTOS</p>
              <p className="text-[9px] font-semibold">{formatCurrency(nota.valor_produtos)}</p>
            </div>
          </div>

          <div className="flex border-b-2 border-black">
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">VALOR DO FRETE</p>
              <p className="text-[9px]">{formatCurrency(nota.valor_frete || 0)}</p>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">VALOR DO SEGURO</p>
              <p className="text-[9px]">{formatCurrency(nota.valor_seguro || 0)}</p>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">DESCONTO</p>
              <p className="text-[9px]">{formatCurrency(nota.valor_desconto || 0)}</p>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">OUTRAS DESPESAS</p>
              <p className="text-[9px]">{formatCurrency(nota.valor_outras_despesas || 0)}</p>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <p className="text-[7px] text-gray-600">VALOR DO IPI</p>
              <p className="text-[9px]">{formatCurrency(nota.valor_ipi || 0)}</p>
            </div>
            <div className="flex-1 p-1">
              <p className="text-[7px] text-gray-600">VALOR TOTAL DA NOTA</p>
              <p className="text-[10px] font-bold">{formatCurrency(nota.valor_total)}</p>
            </div>
          </div>

          {/* Dados dos Produtos */}
          <div className="border-b-2 border-black bg-gray-100 p-1">
            <p className="text-[9px] font-bold">DADOS DOS PRODUTOS / SERVIÇOS</p>
          </div>

          <table className="w-full border-collapse text-[8px]">
            <thead>
              <tr className="border-b border-black bg-gray-50">
                <th className="border-r border-black p-1 text-left">CÓDIGO</th>
                <th className="border-r border-black p-1 text-left">DESCRIÇÃO DO PRODUTO / SERVIÇO</th>
                <th className="border-r border-black p-1 text-center">NCM/SH</th>
                <th className="border-r border-black p-1 text-center">CST</th>
                <th className="border-r border-black p-1 text-center">CFOP</th>
                <th className="border-r border-black p-1 text-center">UN</th>
                <th className="border-r border-black p-1 text-right">QUANT</th>
                <th className="border-r border-black p-1 text-right">VL UNIT</th>
                <th className="border-r border-black p-1 text-right">VL TOTAL</th>
                <th className="border-r border-black p-1 text-right">BC ICMS</th>
                <th className="border-r border-black p-1 text-right">VL ICMS</th>
                <th className="border-r border-black p-1 text-right">VL IPI</th>
                <th className="p-1 text-right">ICMS %</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="border-r border-gray-300 p-1 font-mono">{item.codigo}</td>
                  <td className="border-r border-gray-300 p-1">{item.descricao}</td>
                  <td className="border-r border-gray-300 p-1 text-center font-mono">{item.ncm}</td>
                  <td className="border-r border-gray-300 p-1 text-center">000</td>
                  <td className="border-r border-gray-300 p-1 text-center">{item.cfop}</td>
                  <td className="border-r border-gray-300 p-1 text-center">{item.unidade}</td>
                  <td className="border-r border-gray-300 p-1 text-right">{item.quantidade}</td>
                  <td className="border-r border-gray-300 p-1 text-right">{formatCurrency(item.valor_unitario)}</td>
                  <td className="border-r border-gray-300 p-1 text-right font-semibold">{formatCurrency(item.valor_total)}</td>
                  <td className="border-r border-gray-300 p-1 text-right">{formatCurrency(item.base_icms || 0)}</td>
                  <td className="border-r border-gray-300 p-1 text-right">{formatCurrency(item.valor_icms || 0)}</td>
                  <td className="border-r border-gray-300 p-1 text-right">{formatCurrency(item.valor_ipi || 0)}</td>
                  <td className="p-1 text-right">{item.aliquota_icms || 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Dados Adicionais */}
          <div className="border-t-2 border-black bg-gray-100 p-1">
            <p className="text-[9px] font-bold">DADOS ADICIONAIS</p>
          </div>

          <div className="flex min-h-[60px]">
            <div className="flex-1 border-r-2 border-black p-2">
              <p className="text-[7px] text-gray-600">INFORMAÇÕES COMPLEMENTARES</p>
              <p className="whitespace-pre-wrap text-[8px]">{nota.informacoes_adicionais || "-"}</p>
            </div>
            <div className="w-48 p-2">
              <p className="text-[7px] text-gray-600">RESERVADO AO FISCO</p>
              <p className="whitespace-pre-wrap text-[8px]">{nota.observacoes_fisco || "-"}</p>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-4 text-center text-[8px] text-gray-500">
          <p>Documento gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
          <p className="font-semibold">Este documento é uma representação gráfica da NF-e</p>
        </div>
      </div>
    );
  }
);

DanfePreview.displayName = "DanfePreview";
