import { useState, useCallback } from "react";
import Papa from "papaparse";
import { Upload, Download, FileSpreadsheet, Check, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useOrganization";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ImportClientesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedCliente {
  nome: string;
  documento: string;
  contato: string;
  servico: string;
  valor: string;
  vencimento: string;
  isValid: boolean;
  errors: string[];
}

type ImportStep = "upload" | "preview" | "importing" | "complete";

export function ImportClientesModal({ open, onOpenChange }: ImportClientesModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [parsedData, setParsedData] = useState<ParsedCliente[]>([]);
  const [progress, setProgress] = useState(0);
  const [importResults, setImportResults] = useState({ success: 0, errors: 0 });
  const { data: profile } = useCurrentProfile();
  const queryClient = useQueryClient();

  const resetModal = useCallback(() => {
    setStep("upload");
    setParsedData([]);
    setProgress(0);
    setImportResults({ success: 0, errors: 0 });
  }, []);

  const handleClose = (open: boolean) => {
    if (!open) {
      resetModal();
    }
    onOpenChange(open);
  };

  const downloadTemplate = () => {
    const csvContent = "Nome,Documento,Contato,Servico,Valor,Vencimento\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modelo_clientes.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const validateRow = (row: Record<string, string>): ParsedCliente => {
    const errors: string[] = [];
    const nome = row["Nome"]?.trim() || "";
    const documento = row["Documento"]?.trim() || "";
    const contato = row["Contato"]?.trim() || "";
    const servico = row["Servico"]?.trim() || row["Serviço"]?.trim() || "";
    const valor = row["Valor"]?.trim() || "";
    const vencimento = row["Vencimento"]?.trim() || "";

    if (!nome) errors.push("Nome obrigatório");
    if (valor && isNaN(parseFloat(valor.replace(",", ".")))) {
      errors.push("Valor inválido");
    }
    if (vencimento) {
      const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(vencimento)) {
        errors.push("Data deve estar no formato DD/MM/AAAA");
      }
    }

    return {
      nome,
      documento,
      contato,
      servico,
      valor,
      vencimento,
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validated = results.data.map((row) =>
          validateRow(row as Record<string, string>)
        );
        setParsedData(validated);
        setStep("preview");
      },
      error: () => {
        toast.error("Erro ao processar arquivo CSV");
      },
    });

    event.target.value = "";
  };

  const parseDate = (dateStr: string): string | null => {
    if (!dateStr) return null;
    const parts = dateStr.split("/");
    if (parts.length !== 3) return null;
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  const handleImport = async () => {
    if (!profile?.organization_id) {
      toast.error("Organização não encontrada");
      return;
    }

    const validRows = parsedData.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("Nenhum registro válido para importar");
      return;
    }

    setStep("importing");
    setProgress(0);

    let success = 0;
    let errors = 0;
    const total = validRows.length;

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];

      try {
        // Inserir cliente
        const { data: cliente, error: clienteError } = await supabase
          .from("clientes")
          .insert({
            organization_id: profile.organization_id,
            nome: row.nome,
            cnpj: row.documento || null,
            telefone: row.contato || null,
          })
          .select()
          .single();

        if (clienteError) throw clienteError;

        // Se tiver serviço, criar contrato
        if (row.servico && cliente) {
          const valorNum = row.valor
            ? parseFloat(row.valor.replace(",", "."))
            : 0;
          const dataFim = parseDate(row.vencimento);

          await supabase.from("contratos_historico").insert({
            organization_id: profile.organization_id,
            cliente_id: cliente.id,
            tipo_vinculo: "Contrato",
            servico_prestado: row.servico,
            valor: valorNum,
            recorrente: true,
            data_inicio: new Date().toISOString().split("T")[0],
            data_fim: dataFim,
            status: "Ativo",
          });
        }

        success++;
      } catch {
        errors++;
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setImportResults({ success, errors });
    setStep("complete");
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
    queryClient.invalidateQueries({ queryKey: ["clientes-com-contratos"] });
  };

  const validCount = parsedData.filter((r) => r.isValid).length;
  const invalidCount = parsedData.filter((r) => !r.isValid).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-zinc-950 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Clientes
          </DialogTitle>
          <DialogDescription>
            Importe clientes e contratos a partir de um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center">
              <Upload className="h-10 w-10 text-slate-400" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-medium text-zinc-950">
                Selecione um arquivo CSV
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Faça o upload de uma planilha CSV com os dados dos clientes.
                Use o modelo abaixo como referência.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Baixar Modelo CSV
              </Button>

              <label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Arquivo
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Check className="h-3 w-3 mr-1" />
                {validCount} válidos
              </Badge>
              {invalidCount > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {invalidCount} com erro
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-zinc-950 font-semibold">Nome</TableHead>
                    <TableHead className="text-zinc-950 font-semibold">Documento</TableHead>
                    <TableHead className="text-zinc-950 font-semibold">Contato</TableHead>
                    <TableHead className="text-zinc-950 font-semibold">Serviço</TableHead>
                    <TableHead className="text-zinc-950 font-semibold">Valor</TableHead>
                    <TableHead className="text-zinc-950 font-semibold">Vencimento</TableHead>
                    <TableHead className="text-zinc-950 font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={row.isValid ? "" : "bg-red-50"}
                    >
                      <TableCell className="font-medium text-zinc-950">
                        {row.nome || "-"}
                      </TableCell>
                      <TableCell>{row.documento || "-"}</TableCell>
                      <TableCell>{row.contato || "-"}</TableCell>
                      <TableCell>{row.servico || "-"}</TableCell>
                      <TableCell>
                        {row.valor
                          ? `R$ ${parseFloat(row.valor.replace(",", ".")).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : "-"}
                      </TableCell>
                      <TableCell>{row.vencimento || "-"}</TableCell>
                      <TableCell>
                        {row.isValid ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            OK
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {row.errors.join(", ")}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" onClick={resetModal}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Importar {validCount} cliente{validCount !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="font-medium text-zinc-950">Importando clientes...</h3>
              <p className="text-sm text-muted-foreground">
                Por favor, aguarde enquanto os dados são processados
              </p>
            </div>
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">
                {progress}% concluído
              </p>
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-12 w-12 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-medium text-zinc-950 text-lg">
                Importação concluída!
              </h3>
              <div className="space-y-1">
                <p className="text-sm text-green-600 font-medium">
                  {importResults.success} cliente{importResults.success !== 1 ? "s" : ""} importado{importResults.success !== 1 ? "s" : ""} com sucesso
                </p>
                {importResults.errors > 0 && (
                  <p className="text-sm text-red-600">
                    {importResults.errors} erro{importResults.errors !== 1 ? "s" : ""} durante a importação
                  </p>
                )}
              </div>
            </div>
            <Button onClick={() => handleClose(false)}>Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
