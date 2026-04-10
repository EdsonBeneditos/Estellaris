import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, Download, X, AlertCircle, CheckCircle, Loader2, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { useProdutos } from "@/hooks/useEstoque";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "upload" | "mapping" | "review" | "done";

type ProductField =
  | "nome"
  | "sku"
  | "preco_venda"
  | "preco_custo"
  | "quantidade_estoque"
  | "unidade_medida"
  | "marca"
  | "grupo"
  | "descricao"
  | "ncm";

type ColumnMap = Record<ProductField, string | null>;

interface ReviewRow {
  _id: string;
  nome: string;
  sku: string;
  preco_venda: string;
  preco_custo: string;
  quantidade_estoque: string;
  unidade_medida: string;
  marca: string;
  grupo: string;
  descricao: string;
  ncm: string;
}

interface ImportResult {
  imported: number;
  failed: { index: number; nome: string; error: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_FIELDS: { key: ProductField; label: string; required: boolean }[] = [
  { key: "nome", label: "Nome", required: true },
  { key: "sku", label: "SKU", required: false },
  { key: "preco_venda", label: "Preço de Venda", required: false },
  { key: "preco_custo", label: "Preço de Custo", required: false },
  { key: "quantidade_estoque", label: "Quantidade em Estoque", required: false },
  { key: "unidade_medida", label: "Unidade de Medida", required: false },
  { key: "marca", label: "Marca", required: false },
  { key: "grupo", label: "Grupo", required: false },
  { key: "descricao", label: "Descrição", required: false },
  { key: "ncm", label: "NCM", required: false },
];

const AUTO_DETECT_KEYWORDS: Record<ProductField, string[]> = {
  nome: ["nome", "name", "produto", "product", "descricao_produto"],
  sku: ["sku", "codigo", "code", "ref", "referencia", "cod"],
  preco_venda: ["preco_venda", "precovenda", "price", "valor", "venda", "preco"],
  preco_custo: ["preco_custo", "precocusto", "custo", "cost"],
  quantidade_estoque: ["quantidade", "qty", "stock", "estoque", "qtd", "quant"],
  unidade_medida: ["unidade", "unit", "un", "und", "medida"],
  marca: ["marca", "brand", "fabricante"],
  grupo: ["grupo", "group", "categoria", "category", "departamento"],
  descricao: ["descricao", "descricao", "description", "obs", "detalhe"],
  ncm: ["ncm"],
};

const EMPTY_COLUMN_MAP: ColumnMap = {
  nome: null,
  sku: null,
  preco_venda: null,
  preco_custo: null,
  quantidade_estoque: null,
  unidade_medida: null,
  marca: null,
  grupo: null,
  descricao: null,
  ncm: null,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeStr(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function autoDetectMapping(headers: string[]): ColumnMap {
  const map = { ...EMPTY_COLUMN_MAP };
  for (const field of PRODUCT_FIELDS) {
    const keywords = AUTO_DETECT_KEYWORDS[field.key];
    const matched = headers.find((h) =>
      keywords.some((kw) => normalizeStr(h).includes(kw))
    );
    if (matched) map[field.key] = matched;
  }
  return map;
}

function parseNumber(val: string): number {
  if (!val?.trim()) return 0;
  return parseFloat(val.trim().replace(",", ".")) || 0;
}

function parseInt2(val: string): number {
  if (!val?.trim()) return 0;
  return Math.max(0, Math.floor(parseFloat(val.trim().replace(",", ".")) || 0));
}

function downloadTemplate() {
  const headers =
    "nome,sku,preco_venda,preco_custo,quantidade_estoque,unidade_medida,marca,grupo,descricao,ncm";
  const example =
    '"Produto Exemplo","SKU-001","99.90","50.00","100","UN","Marca X","Grupo Y","Descrição do produto","00000000"';
  const csv = `${headers}\n${example}`;
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo_importacao_produtos.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function getRowErrors(
  row: ReviewRow,
  allRows: ReviewRow[],
  existingSkus: Set<string>
): string[] {
  const errors: string[] = [];

  if (!row.nome.trim()) errors.push("Nome é obrigatório");

  if (row.sku.trim()) {
    if (existingSkus.has(row.sku.trim().toLowerCase())) {
      errors.push("SKU já existe no banco");
    }
    const dupInImport = allRows.some(
      (r) =>
        r._id !== row._id &&
        r.sku.trim().toLowerCase() === row.sku.trim().toLowerCase()
    );
    if (dupInImport) errors.push("SKU duplicado na importação");
  }

  const pv = parseNumber(row.preco_venda);
  if (row.preco_venda.trim() && (isNaN(pv) || pv < 0))
    errors.push("Preço de venda inválido");

  const pc = parseNumber(row.preco_custo);
  if (row.preco_custo.trim() && (isNaN(pc) || pc < 0))
    errors.push("Preço de custo inválido");

  const qty = parseInt2(row.quantidade_estoque);
  if (row.quantidade_estoque.trim() && (isNaN(qty) || qty < 0))
    errors.push("Quantidade inválida");

  return errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ImportProdutosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportProdutosModal({ open, onOpenChange }: ImportProdutosModalProps) {
  const queryClient = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const { data: existingProdutos = [] } = useProdutos();

  const [step, setStep] = useState<Step>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [columnMap, setColumnMap] = useState<ColumnMap>(EMPTY_COLUMN_MAP);
  const [reviewRows, setReviewRows] = useState<ReviewRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(0);

  const existingSkus = new Set(
    existingProdutos.filter((p) => p.sku).map((p) => p.sku!.toLowerCase())
  );

  // ── Reset on close ──────────────────────────────────────────────────────────
  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep("upload");
      setFileName("");
      setHeaders([]);
      setRawRows([]);
      setColumnMap(EMPTY_COLUMN_MAP);
      setReviewRows([]);
      setImportResult(null);
    }, 300);
  };

  // ── File parsing ────────────────────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setFileName(file.name);

    if (file.name.match(/\.(xlsx|xls)$/i)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result;
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
          defval: "",
          raw: false,
        });
        if (jsonData.length === 0) {
          toast.error("Arquivo vazio ou sem dados");
          return;
        }
        const hdrs = Object.keys(jsonData[0]);
        const rows = jsonData.map((row) =>
          Object.fromEntries(hdrs.map((h) => [h, String(row[h] ?? "")]))
        );
        setHeaders(hdrs);
        setRawRows(rows);
        setColumnMap(autoDetectMapping(hdrs));
        setStep("mapping");
      };
      reader.readAsArrayBuffer(file);
    } else {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (!result.data.length) {
            toast.error("Arquivo vazio ou sem dados");
            return;
          }
          const hdrs = result.meta.fields || [];
          setHeaders(hdrs);
          setRawRows(result.data);
          setColumnMap(autoDetectMapping(hdrs));
          setStep("mapping");
        },
        error: () => toast.error("Erro ao ler o arquivo CSV"),
      });
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) parseFile(file);
    },
    [parseFile]
  );

  // ── Build review rows from mapping ──────────────────────────────────────────
  const handleProceedToReview = () => {
    if (!columnMap.nome) {
      toast.error("Mapeie pelo menos o campo Nome");
      return;
    }
    const rows: ReviewRow[] = rawRows.map((raw) => ({
      _id: String(idCounter.current++),
      nome: raw[columnMap.nome!] ?? "",
      sku: columnMap.sku ? (raw[columnMap.sku] ?? "") : "",
      preco_venda: columnMap.preco_venda ? (raw[columnMap.preco_venda] ?? "") : "",
      preco_custo: columnMap.preco_custo ? (raw[columnMap.preco_custo] ?? "") : "",
      quantidade_estoque: columnMap.quantidade_estoque
        ? (raw[columnMap.quantidade_estoque] ?? "")
        : "",
      unidade_medida: columnMap.unidade_medida
        ? (raw[columnMap.unidade_medida] ?? "")
        : "UN",
      marca: columnMap.marca ? (raw[columnMap.marca] ?? "") : "",
      grupo: columnMap.grupo ? (raw[columnMap.grupo] ?? "") : "",
      descricao: columnMap.descricao ? (raw[columnMap.descricao] ?? "") : "",
      ncm: columnMap.ncm ? (raw[columnMap.ncm] ?? "") : "",
    }));
    setReviewRows(rows);
    setStep("review");
  };

  // ── Inline row editing ──────────────────────────────────────────────────────
  const updateRow = (id: string, field: keyof ReviewRow, value: string) => {
    setReviewRows((prev) =>
      prev.map((r) => (r._id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeRow = (id: string) => {
    setReviewRows((prev) => prev.filter((r) => r._id !== id));
  };

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImport = async () => {
    const validRows = reviewRows.filter(
      (r) => getRowErrors(r, reviewRows, existingSkus).length === 0
    );
    if (validRows.length === 0) {
      toast.error("Nenhum produto válido para importar");
      return;
    }

    setIsImporting(true);

    try {
      // Resolve group names → IDs
      const groupNames = [
        ...new Set(validRows.map((r) => r.grupo.trim()).filter(Boolean)),
      ];
      const groupMap: Record<string, string> = {};

      if (groupNames.length > 0) {
        const { data: existingGroups } = await supabase
          .from("grupos_produtos")
          .select("id, nome")
          .in("nome", groupNames);

        (existingGroups || []).forEach((g) => {
          groupMap[g.nome.toLowerCase()] = g.id;
        });

        // Create missing groups
        const missingGroups = groupNames.filter(
          (name) => !groupMap[name.toLowerCase()]
        );
        for (const groupName of missingGroups) {
          const ref = groupName.slice(0, 6).toUpperCase().replace(/\s+/g, "-");
          const { data: created } = await supabase
            .from("grupos_produtos")
            .insert({
              nome: groupName,
              numero_referencia: ref,
              organization_id: profile?.organization_id,
            })
            .select("id, nome")
            .single();
          if (created) groupMap[created.nome.toLowerCase()] = created.id;
        }
      }

      // Insert products
      let imported = 0;
      const failed: ImportResult["failed"] = [];

      for (let i = 0; i < validRows.length; i++) {
        const row = validRows[i];
        const grupo_id = row.grupo.trim()
          ? (groupMap[row.grupo.trim().toLowerCase()] ?? null)
          : null;

        const { error } = await supabase.from("produtos").insert({
          nome: row.nome.trim(),
          sku: row.sku.trim() || null,
          preco_venda: parseNumber(row.preco_venda),
          preco_custo: parseNumber(row.preco_custo),
          quantidade_estoque: parseInt2(row.quantidade_estoque),
          unidade_medida: row.unidade_medida.trim() || "UN",
          marca: row.marca.trim() || null,
          grupo_id,
          descricao: row.descricao.trim() || null,
          ncm: row.ncm.trim() || null,
          organization_id: profile?.organization_id,
          ativo: true,
        });

        if (error) {
          failed.push({ index: i + 1, nome: row.nome, error: error.message });
        } else {
          imported++;
        }
      }

      setImportResult({ imported, failed });
      setStep("done");
      queryClient.invalidateQueries({ queryKey: ["produtos"] });

      if (imported > 0) {
        toast.success(
          `${imported} produto${imported !== 1 ? "s" : ""} importado${imported !== 1 ? "s" : ""} com sucesso`
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao importar produtos");
    } finally {
      setIsImporting(false);
    }
  };

  // ── Computed ────────────────────────────────────────────────────────────────
  const rowsWithErrors = reviewRows.filter(
    (r) => getRowErrors(r, reviewRows, existingSkus).length > 0
  );
  const validCount = reviewRows.length - rowsWithErrors.length;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>
            {step === "upload" && "Importar Produtos"}
            {step === "mapping" && "Mapear Colunas"}
            {step === "review" && `Revisar ${reviewRows.length} produto(s)`}
            {step === "done" && "Importação Concluída"}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-2">
            {(["upload", "mapping", "review", "done"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    step === s
                      ? "bg-primary"
                      : i <
                          ["upload", "mapping", "review", "done"].indexOf(step)
                        ? "bg-primary/40"
                        : "bg-muted"
                  }`}
                />
                {i < 3 && <div className="h-px w-6 bg-border" />}
              </div>
            ))}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ── STEP 1: Upload ─────────────────────────────────────────────── */}
          {step === "upload" && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-base font-medium">
                  Arraste um arquivo CSV ou XLSX aqui
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ou clique para selecionar
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Download className="h-4 w-4" />
                  Baixar modelo de importação (CSV)
                </button>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Campos suportados:</p>
                <p>
                  nome, sku, preco_venda, preco_custo, quantidade_estoque,
                  unidade_medida, marca, grupo, descricao, ncm
                </p>
                <p className="text-xs">
                  O campo <strong>nome</strong> é obrigatório. Os demais são
                  opcionais.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: Mapping ────────────────────────────────────────────── */}
          {step === "mapping" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>
                  Arquivo: <strong>{fileName}</strong> — {rawRows.length} linha(s)
                  detectada(s)
                </span>
              </div>

              {/* Preview */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Prévia das primeiras linhas:
                </p>
                <div className="overflow-x-auto rounded-lg border border-border/50">
                  <table className="text-xs w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        {headers.map((h) => (
                          <th
                            key={h}
                            className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-t border-border/30">
                          {headers.map((h) => (
                            <td
                              key={h}
                              className="px-3 py-1.5 text-muted-foreground max-w-[120px] truncate"
                            >
                              {row[h] || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Field mapping */}
              <div>
                <p className="text-sm font-medium mb-3">
                  Mapeie as colunas do arquivo para os campos do produto:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRODUCT_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-center gap-3">
                      <span className="text-sm w-44 shrink-0">
                        {field.label}
                        {field.required && (
                          <span className="text-destructive ml-0.5">*</span>
                        )}
                      </span>
                      <Select
                        value={columnMap[field.key] ?? "__none__"}
                        onValueChange={(v) =>
                          setColumnMap((prev) => ({
                            ...prev,
                            [field.key]: v === "__none__" ? null : v,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs flex-1">
                          <SelectValue placeholder="Não importar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-muted-foreground">
                              Não importar
                            </span>
                          </SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ─────────────────────────────────────────────── */}
          {step === "review" && (
            <div className="space-y-3">
              {rowsWithErrors.length > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {rowsWithErrors.length} linha(s) com erro serão ignoradas na
                    importação. Corrija ou remova-as.
                  </span>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Clique em qualquer campo para editar. Use o botão × para remover uma
                linha.
              </p>

              <div className="overflow-auto max-h-[50vh] rounded-lg border border-border/50">
                <table className="w-full text-xs min-w-[900px]">
                  <thead className="sticky top-0 z-10 bg-card border-b border-border/50">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground w-[160px]">
                        Nome *
                      </th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground w-[90px]">
                        SKU
                      </th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground w-[90px]">
                        P. Venda
                      </th>
                      <th className="px-2 py-2 text-right font-medium text-muted-foreground w-[90px]">
                        P. Custo
                      </th>
                      <th className="px-2 py-2 text-center font-medium text-muted-foreground w-[70px]">
                        Qtd
                      </th>
                      <th className="px-2 py-2 text-center font-medium text-muted-foreground w-[60px]">
                        Un
                      </th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground w-[90px]">
                        Marca
                      </th>
                      <th className="px-2 py-2 text-left font-medium text-muted-foreground w-[100px]">
                        Grupo
                      </th>
                      <th className="px-2 py-2 w-[36px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewRows.map((row) => {
                      const errors = getRowErrors(row, reviewRows, existingSkus);
                      const hasError = errors.length > 0;
                      return (
                        <>
                          <tr
                            key={row._id}
                            className={`border-b border-border/30 ${hasError ? "bg-destructive/5" : "hover:bg-muted/20"}`}
                          >
                            <td className="px-1 py-1">
                              <input
                                className={`w-full bg-transparent px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs ${hasError && !row.nome.trim() ? "ring-1 ring-destructive" : ""}`}
                                value={row.nome}
                                onChange={(e) =>
                                  updateRow(row._id, "nome", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                className="w-full bg-transparent px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                                value={row.sku}
                                onChange={(e) =>
                                  updateRow(row._id, "sku", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                className="w-full bg-transparent px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs text-right"
                                value={row.preco_venda}
                                onChange={(e) =>
                                  updateRow(row._id, "preco_venda", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                className="w-full bg-transparent px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs text-right"
                                value={row.preco_custo}
                                onChange={(e) =>
                                  updateRow(row._id, "preco_custo", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                className="w-full bg-transparent px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs text-center"
                                value={row.quantidade_estoque}
                                onChange={(e) =>
                                  updateRow(
                                    row._id,
                                    "quantidade_estoque",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                className="w-full bg-transparent px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs text-center uppercase"
                                value={row.unidade_medida}
                                onChange={(e) =>
                                  updateRow(
                                    row._id,
                                    "unidade_medida",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                className="w-full bg-transparent px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                                value={row.marca}
                                onChange={(e) =>
                                  updateRow(row._id, "marca", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1">
                              <input
                                className="w-full bg-transparent px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                                value={row.grupo}
                                onChange={(e) =>
                                  updateRow(row._id, "grupo", e.target.value)
                                }
                              />
                            </td>
                            <td className="px-1 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => removeRow(row._id)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                          {hasError && (
                            <tr
                              key={`${row._id}-err`}
                              className="bg-destructive/5 border-b border-border/30"
                            >
                              <td
                                colSpan={9}
                                className="px-3 pb-1.5 text-[10px] text-destructive"
                              >
                                {errors.join(" · ")}
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>
                  {validCount} válido(s) · {rowsWithErrors.length} com erro
                </span>
                {rowsWithErrors.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setReviewRows((prev) =>
                        prev.filter(
                          (r) => getRowErrors(r, prev, existingSkus).length === 0
                        )
                      )
                    }
                    className="text-destructive hover:underline"
                  >
                    Remover todos com erro
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 4: Done ───────────────────────────────────────────────── */}
          {step === "done" && importResult && (
            <div className="space-y-4 py-4">
              {importResult.imported > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">
                    {importResult.imported} produto(s) importado(s) com sucesso
                  </span>
                </div>
              )}

              {importResult.failed.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {importResult.failed.length} produto(s) com falha:
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {importResult.failed.map((f) => (
                      <div
                        key={f.index}
                        className="text-xs px-3 py-1.5 rounded bg-destructive/10 text-destructive"
                      >
                        <strong>#{f.index} {f.nome}:</strong> {f.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <DialogFooter className="px-6 py-4 border-t border-border/50">
          {step === "upload" && (
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
          )}

          {step === "mapping" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
              >
                Voltar
              </Button>
              <Button
                onClick={handleProceedToReview}
                disabled={!columnMap.nome}
              >
                Próximo — Revisar dados
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button
                variant="outline"
                onClick={() => setStep("mapping")}
                disabled={isImporting}
              >
                Voltar
              </Button>
              <Button
                onClick={handleImport}
                disabled={isImporting || validCount === 0}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  `Importar ${validCount} produto${validCount !== 1 ? "s" : ""}`
                )}
              </Button>
            </>
          )}

          {step === "done" && (
            <Button onClick={handleClose}>Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
