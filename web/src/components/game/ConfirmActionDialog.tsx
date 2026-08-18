import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmActionDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: ConfirmActionDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl bg-background p-4 shadow-2xl">
        <div className="mb-3 flex items-center gap-3">
          <span className={`flex size-10 items-center justify-center rounded-2xl ${danger ? "bg-red-500/12 text-red-600" : "bg-primary/10 text-primary"}`}>
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{body}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" className="rounded-2xl" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={danger ? "destructive" : "default"}
            className="rounded-2xl"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
