"use client";

import { useState } from "react";
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
import { RatingStars } from "@/components/ui/rating-stars";
import { RATING_DIMENSIONS, RATING_MIN, RATING_MAX } from "@/lib/constants/enums";

const REVIEW_MAX_LENGTH = 1000;

export type RatingPayload = {
  drivingSkill: number;
  professionalBehavior: number;
  punctuality: number;
  review?: string;
};

export type RateDriverModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverName?: string;
  onSubmit: (payload: RatingPayload) => void | Promise<void>;
  loading?: boolean;
};

const dimensionLabels: Record<(typeof RATING_DIMENSIONS)[number], string> = {
  drivingSkill: "Driving skill",
  professionalBehavior: "Professional behavior",
  punctuality: "Punctuality",
};

export function RateDriverModal({
  open,
  onOpenChange,
  driverName,
  onSubmit,
  loading,
}: RateDriverModalProps) {
  const [scores, setScores] = useState<Record<(typeof RATING_DIMENSIONS)[number], number>>({
    drivingSkill: 0,
    professionalBehavior: 0,
    punctuality: 0,
  });
  const [review, setReview] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setScores({ drivingSkill: 0, professionalBehavior: 0, punctuality: 0 });
    setReview("");
    setError(null);
  };

  const allScored = RATING_DIMENSIONS.every(
    (d) => scores[d] >= RATING_MIN && scores[d] <= RATING_MAX
  );

  const handleSubmit = async () => {
    if (!allScored) {
      setError("Please rate all three dimensions before submitting.");
      return;
    }
    setError(null);
    const payload: RatingPayload = {
      drivingSkill: scores.drivingSkill,
      professionalBehavior: scores.professionalBehavior,
      punctuality: scores.punctuality,
    };
    const trimmed = review.trim();
    if (trimmed) payload.review = trimmed;
    await onSubmit(payload);
    reset();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Rate {driverName ? driverName : "your driver"}
          </DialogTitle>
          <DialogDescription>
            Your feedback helps other customers find great drivers.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {RATING_DIMENSIONS.map((dim) => (
            <div key={dim} className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <Label htmlFor={`rating-${dim}`} className="font-medium">
                {dimensionLabels[dim]}
              </Label>
              <RatingStars
                value={scores[dim]}
                mode="input"
                size="lg"
                onChange={(v) => setScores((prev) => ({ ...prev, [dim]: v }))}
                label={`${dimensionLabels[dim]} rating`}
              />
            </div>
          ))}

          <div className="flex flex-col gap-2">
            <Label htmlFor="review">Review (optional)</Label>
            <Textarea
              id="review"
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value.slice(0, REVIEW_MAX_LENGTH))}
              placeholder="Share your experience…"
            />
            <span className="self-end text-xs text-muted-foreground">
              {review.length}/{REVIEW_MAX_LENGTH}
            </span>
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={loading || !allScored}>
            {loading ? "Submitting…" : "Submit rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
