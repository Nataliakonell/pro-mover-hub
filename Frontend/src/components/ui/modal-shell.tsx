import * as React from "react";
import { X, Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CancelConfirmModal } from "@/components/ui/cancel-confirm-modal";

const shellVariants = cva(
  "relative w-full max-h-[94vh] flex flex-col rounded-2xl bg-card text-card-foreground shadow-2xl border border-border overflow-hidden z-10",
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-3xl",
        lg: "max-w-5xl",
      },
    },
    defaultVariants: { size: "md" },
  }
);

type IconBg = "blue" | "violet" | "teal" | "amber" | "slate" | "orange" | "emerald" | "red";

const iconBgMap: Record<IconBg, string> = {
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  red: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export interface ModalShellProps extends VariantProps<typeof shellVariants> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  iconBg?: IconBg;
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  footerProps?: {
    onCancel?: () => void;
    onSave?: () => void;
    saveLabel?: string;
    cancelLabel?: string;
    saving?: boolean;
    saveDisabled?: boolean;
    cancelDisabled?: boolean;
    saveClassName?: string;
    hideCancel?: boolean;
    leftActions?: React.ReactNode;
    align?: "end" | "between";
  };
  isDirty?: boolean;
  showCancelModal?: boolean;
  onCancelModalClose?: () => void;
  onCancelModalConfirm?: () => void;
  closeOnBackdrop?: boolean;
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  icon,
  iconBg = "blue",
  size = "md",
  animated = true,
  children,
  footer,
  footerProps,
  showCancelModal,
  onCancelModalClose,
  onCancelModalConfirm,
  closeOnBackdrop = true,
}: ModalShellProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop) onClose();
  };

  const align = footerProps?.align ?? (footerProps?.leftActions ? "between" : "end");

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 md:p-6">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          style={{ top: 0, left: 0, width: "100vw", height: "100vh" }}
          onClick={handleBackdropClick}
        />
        <div className={cn(shellVariants({ size }), "z-[61]", animated && "animate-in fade-in zoom-in-95")}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", iconBgMap[iconBg])}>
                  {icon}
                </div>
              )}
              <h2 className="text-base font-bold text-foreground">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>

          {/* Footer */}
          {(footer || footerProps) && (
            <div
              className={cn(
                "flex items-center gap-2 px-6 py-4 border-t border-border bg-muted/40 shrink-0",
                align === "between" ? "justify-between" : "justify-end"
              )}
            >
              {footer ? (
                footer
              ) : (
                <>
                  {footerProps?.leftActions && <div>{footerProps.leftActions}</div>}
                  <div className="flex items-center gap-2">
                    {!footerProps?.hideCancel && (
                      <Button
                        variant="outline"
                        onClick={footerProps?.onCancel ?? onClose}
                        disabled={footerProps?.cancelDisabled}
                        className="h-9 px-4 text-sm font-medium"
                      >
                        {footerProps?.cancelLabel ?? "Cancelar"}
                      </Button>
                    )}
                    {footerProps?.onSave && (
                      <Button
                        onClick={footerProps.onSave}
                        disabled={footerProps?.saving || footerProps?.saveDisabled}
                        className={cn("bg-primary text-primary-foreground font-medium h-9 px-4", footerProps?.saveClassName)}
                      >
                        {footerProps?.saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {footerProps?.saveLabel ?? "Salvar"}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {showCancelModal !== undefined && onCancelModalClose && onCancelModalConfirm && (
        <CancelConfirmModal
          isOpen={showCancelModal}
          onClose={onCancelModalClose}
          onConfirm={onCancelModalConfirm}
        />
      )}
    </>
  );
}
