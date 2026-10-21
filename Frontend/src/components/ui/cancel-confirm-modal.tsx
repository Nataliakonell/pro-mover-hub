import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface CancelConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export function CancelConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Descartar alterações?",
  description = "Você tem alterações não salvas. Se você cancelar agora, essas alterações serão perdidas.",
}: CancelConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md scale-100 rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all duration-300 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-300">
            <AlertCircle className="h-6 w-6" />
          </div>
          
          <div className="flex-1 pt-1">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xl border-border hover:bg-muted h-10 px-4"
          >
            Voltar
          </Button>
          <Button
            onClick={onConfirm}
            className="rounded-xl bg-blue-800 hover:bg-blue-900 text-white h-10 px-4 shadow-sm"
          >
            Descartar alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
