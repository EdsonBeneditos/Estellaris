import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { OrcamentosList } from "@/components/orcamentos/OrcamentosList";
import { OrcamentoForm } from "@/components/orcamentos/OrcamentoForm";
import { OrcamentoViewModal } from "@/components/orcamentos/OrcamentoViewModal";
import { OrcamentoPreview } from "@/components/orcamentos/OrcamentoPreview";
import { Orcamento, useOrcamentoItens } from "@/hooks/useOrcamentos";
import { useCurrentOrganization } from "@/hooks/useOrganization";

type View = "list" | "form";

export default function Orcamentos() {
  const [view, setView] = useState<View>("list");
  const [selectedOrcamento, setSelectedOrcamento] = useState<Orcamento | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [pdfOrcamento, setPdfOrcamento] = useState<Orcamento | null>(null);
  
  const pdfRef = useRef<HTMLDivElement>(null);
  const { data: pdfItems = [] } = useOrcamentoItens(pdfOrcamento?.id || null);
  const { data: organization } = useCurrentOrganization();

  const handleNewOrcamento = () => {
    setSelectedOrcamento(null);
    setView("form");
  };

  const handleEditOrcamento = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setView("form");
  };

  const handleViewOrcamento = (orcamento: Orcamento) => {
    setSelectedOrcamento(orcamento);
    setViewModalOpen(true);
  };

  const handleGeneratePdf = async (orcamento: Orcamento) => {
    setPdfOrcamento(orcamento);
    
    // Wait for items to load and component to render
    setTimeout(async () => {
      if (!pdfRef.current) {
        toast.error("Erro ao preparar PDF");
        return;
      }

      try {
        const canvas = await html2canvas(pdfRef.current, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        const pdf = new jsPDF({
          orientation: "portrait",
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
        setPdfOrcamento(null);
      }
    }, 500);
  };

  const handleFormSuccess = () => {
    setView("list");
    setSelectedOrcamento(null);
  };

  const handleBack = () => {
    setView("list");
    setSelectedOrcamento(null);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {view === "list" ? (
          <OrcamentosList
            onNewOrcamento={handleNewOrcamento}
            onEditOrcamento={handleEditOrcamento}
            onViewOrcamento={handleViewOrcamento}
            onGeneratePdf={handleGeneratePdf}
          />
        ) : (
          <OrcamentoForm
            orcamento={selectedOrcamento}
            onBack={handleBack}
            onSuccess={handleFormSuccess}
          />
        )}

        <OrcamentoViewModal
          orcamento={selectedOrcamento}
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
        />

        {/* Hidden PDF preview for generation */}
        {pdfOrcamento && (
          <div className="fixed left-[-9999px] top-0">
            <OrcamentoPreview
              ref={pdfRef}
              orcamento={pdfOrcamento}
              items={pdfItems}
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
    </div>
  );
}
