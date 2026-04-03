import { useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DanfePreview } from "./DanfePreview";
import { NotaFiscal, useNotaFiscalItens } from "@/hooks/useNotasFiscais";
import { toast } from "sonner";

interface DanfeViewModalProps {
  nota: NotaFiscal;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DanfeViewModal({ nota, open, onOpenChange }: DanfeViewModalProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const { data: itens = [] } = useNotaFiscalItens(nota.id);

  const handlePrint = () => {
    window.print();
  };

  const handleGeneratePdf = async () => {
    if (!previewRef.current) return;

    try {
      toast.info("Gerando PDF...");
      
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`NF-e_${String(nota.numero_nota).padStart(6, "0")}.pdf`);
      
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-6 py-4 print:hidden">
          <DialogTitle>
            DANFE - NF-e #{String(nota.numero_nota).padStart(6, "0")}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button size="sm" onClick={handleGeneratePdf} className="gap-2">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </div>
        </DialogHeader>
        <div className="overflow-auto p-4" style={{ maxHeight: "calc(95vh - 80px)" }}>
          <DanfePreview ref={previewRef} nota={nota} itens={itens} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
