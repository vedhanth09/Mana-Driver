"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const REASON_MAX_LENGTH = 500;

export type CancelJobModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  loading?: boolean;
  title?: string;
  description?: string;
};

export function CancelJobModal({
  open,
  onOpenChange,
  onConfirm,
  loading,
  title = "Cancel this job?",
  description = "This will notify the other party. This action cannot be undone.",
}: CancelJobModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    const trimmed = reason.trim();
    await onConfirm(trimmed.length > 0 ? trimmed : undefined);
    setReason("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setReason("");
        onOpenChange(o);
      }}
    >
      <DialogContent aria-labelledby="cancel-job-title" aria-describedby="cancel-job-desc">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
            >
              <AlertTriangle className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <DialogTitle id="cancel-job-title">{title}</DialogTitle>
              <DialogDescription id="cancel-job-desc">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="cancel-reason">Reason (optional)</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX_LENGTH))}
            placeholder="Let the other party know why…"
            rows={3}
            aria-describedby="cancel-reason-counter"
          />
          <span
            id="cancel-reason-counter"
            className="self-end text-xs text-muted-foreground"
          >
            {reason.length}/{REASON_MAX_LENGTH}
          </span>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Go Back
          </Button>
          <Button
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={loading}
          >
            {loading ? "Cancelling…" : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
