import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { NewLeadModal } from "@/components/leads/NewLeadModal";
import { useLeads } from "@/hooks/useLeads";

export default function Leads() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: leads = [], isLoading } = useLeads();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Visualize e gerencie todos os seus leads
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <LeadsTable leads={leads} isLoading={isLoading} />

      <NewLeadModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
