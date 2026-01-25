import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VisitaConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataAnterior: string;
  onConfirm: () => void;
  onSkip: () => void;
}

export function VisitaConfirmDialog({
  open,
  onOpenChange,
  dataAnterior,
  onConfirm,
  onSkip,
}: VisitaConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-zinc-950">
            Registrar visita concluída?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            A visita anterior estava agendada para{" "}
            <strong className="text-zinc-700">
              {format(new Date(dataAnterior), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </strong>
            . Deseja registrar esta visita como concluída na linha do tempo do cliente?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onSkip}>Não registrar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Registrar como concluída
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
