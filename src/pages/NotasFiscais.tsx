import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { MainLayout } from "@/components/layout/MainLayout";
import { NotasFiscaisList } from "@/components/notas-fiscais/NotasFiscaisList";
import { NotaFiscalForm } from "@/components/notas-fiscais/NotaFiscalForm";
import { DanfeViewModal } from "@/components/notas-fiscais/DanfeViewModal";
import { DanfePreview } from "@/components/notas-fiscais/DanfePreview";
import { NotaFiscal, useNotaFiscalItens } from "@/hooks/useNotasFiscais";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

type ViewMode = "list" | "form";

export default function NotasFiscais() {
  const [searchParams, setSearchParams] = useSearchParams();
  const orcamentoIdFromUrl = searchParams.get("orcamento");
  
  const [view, setView] = useState<ViewMode>(orcamentoIdFromUrl ? "form" : "list");
  const [selectedNota, setSelectedNota] = useState<NotaFiscal | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [notaForView, setNotaForView] = useState<NotaFiscal | null>(null);
  const [orcamentoId, setOrcamentoId] = useState<string | null>(orcamentoIdFromUrl);

  const pdfRef = useRef<HTMLDivElement>(null);
  const { data: itensForPdf = [] } = useNotaFiscalItens(notaForView?.id || null);

  const handleNewNota = () => {
    setSelectedNota(null);
    setOrcamentoId(null);
    setView("form");
  };

  const handleEditNota = (nota: NotaFiscal) => {
    setSelectedNota(nota);
    setOrcamentoId(null);
    setView("form");
  };

  const handleViewNota = (nota: NotaFiscal) => {
    setNotaForView(nota);
    setViewModalOpen(true);
  };

  const handleGeneratePdf = async (nota: NotaFiscal) => {
    setNotaForView(nota);
    
    // Pequeno delay para garantir que os itens foram carregados
    setTimeout(async () => {
      if (!pdfRef.current) return;

      try {
        toast.info("Gerando PDF...");
        
        const canvas = await html2canvas(pdfRef.current, {
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
        setNotaForView(null);
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error("Erro ao gerar PDF");
        setNotaForView(null);
      }
    }, 500);
  };

  const handleBack = () => {
    setSelectedNota(null);
    setOrcamentoId(null);
    setSearchParams({});
    setView("list");
  };

  const handleSuccess = () => {
    setSelectedNota(null);
    setOrcamentoId(null);
    setSearchParams({});
    setView("list");
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {view === "list" ? (
          <NotasFiscaisList
            onNewNota={handleNewNota}
            onEditNota={handleEditNota}
            onViewNota={handleViewNota}
            onGeneratePdf={handleGeneratePdf}
          />
        ) : (
          <NotaFiscalForm
            nota={selectedNota}
            orcamentoId={orcamentoId}
            onBack={handleBack}
            onSuccess={handleSuccess}
          />
        )}
      </div>

      {/* Modal de visualização DANFE */}
      {notaForView && viewModalOpen && (
        <DanfeViewModal
          nota={notaForView}
          open={viewModalOpen}
          onOpenChange={(open) => {
            setViewModalOpen(open);
            if (!open) setNotaForView(null);
          }}
        />
      )}

      {/* Hidden PDF preview for generation */}
      {notaForView && !viewModalOpen && (
        <div className="fixed left-[-9999px] top-0">
          <DanfePreview ref={pdfRef} nota={notaForView} itens={itensForPdf} />
        </div>
      )}
    </MainLayout>
  );
}
