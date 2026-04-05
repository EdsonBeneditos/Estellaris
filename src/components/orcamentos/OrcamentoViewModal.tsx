import { useRef, useState } from "react";
import { Printer, FileDown, Loader2, X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrcamentoPreview } from "./OrcamentoPreview";
import { Orcamento, useOrcamentoItens } from "@/hooks/useOrcamentos";
import { useCurrentOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface OrcamentoViewModalProps {
  orcamento: Orcamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrcamentoViewModal({ orcamento, open, onOpenChange }: OrcamentoViewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: items = [], isLoading } = useOrcamentoItens(orcamento?.id || null);
  const { data: organization } = useCurrentOrganization();

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    if (!previewRef.current || !orcamento) return;

    setIsGenerating(true);
    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF({
        orientation: imgHeight > 297 ? "portrait" : "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      
      const fileName = `orcamento_${String(orcamento.numero_orcamento).padStart(5, "0")}.pdf`;
      pdf.save(fileName);
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!orcamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-4xl overflow-hidden p-0 print:max-w-none print:border-none print:shadow-none [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-6 py-4 print:hidden">
          <DialogTitle>Visualizar Orçamento</DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button
              size="sm"
              onClick={handleGeneratePdf}
              disabled={isGenerating}
              className="gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Gerar PDF
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto bg-slate-100 p-4 print:bg-white print:p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="shadow-lg print:shadow-none">
              <OrcamentoPreview
                ref={previewRef}
                orcamento={orcamento}
                items={items}
                orgData={organization ? {
                  nome: organization.nome,
                  cnpj: organization.cnpj || undefined,
                  logo_url: (organization as any).orcamento_logo_url || undefined,
                  orcamento_cabecalho: (organization as any).orcamento_cabecalho || undefined,
                  orcamento_rodape: (organization as any).orcamento_rodape || undefined,
                } : null}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
