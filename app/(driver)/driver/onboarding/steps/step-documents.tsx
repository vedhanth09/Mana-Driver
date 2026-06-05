"use client";

import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { CheckCircle2, FileText, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  DOCUMENT_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
  type DocumentType,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const DOC_LABELS: Record<DocumentType, { title: string; helper: string }> = {
  aadhaar: {
    title: "Aadhaar Card",
    helper: "Government-issued identity proof.",
  },
  pan: {
    title: "PAN Card",
    helper: "Permanent Account Number for verification.",
  },
  license: {
    title: "Driving Licence",
    helper: "Valid commercial or LMV licence.",
  },
};

type Props = {
  files: Partial<Record<DocumentType, File>>;
  onChange: (files: Partial<Record<DocumentType, File>>) => void;
};

export function StepDocuments({ files, onChange }: Props) {
  const setFile = (docType: DocumentType, file: File | undefined) => {
    const next = { ...files };
    if (file) next[docType] = file;
    else delete next[docType];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Optional for now — you can add these later from your profile to get
        verified. Max {MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)} MB each. JPG,
        PNG, WEBP, or PDF.
      </p>

      <div className="flex flex-col gap-3">
        {DOCUMENT_TYPES.map((docType) => (
          <DocumentDropzone
            key={docType}
            docType={docType}
            file={files[docType]}
            onSelect={(f) => setFile(docType, f)}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentDropzone({
  docType,
  file,
  onSelect,
}: {
  docType: DocumentType;
  file: File | undefined;
  onSelect: (file: File | undefined) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setError(null);
      if (rejections.length > 0) {
        const reason = rejections[0]?.errors[0]?.code;
        if (reason === "file-too-large") {
          setError(
            `Max ${MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)} MB`,
          );
        } else if (reason === "file-invalid-type") {
          setError("Only JPG, PNG, WEBP, or PDF");
        } else {
          setError("File could not be added");
        }
        return;
      }
      const next = accepted[0];
      if (next) onSelect(next);
    },
    [onSelect],
  );

  const accept = ALLOWED_DOCUMENT_MIME_TYPES.reduce<Record<string, string[]>>(
    (acc, mime) => {
      acc[mime] = [];
      return acc;
    },
    {},
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    maxSize: MAX_DOCUMENT_SIZE_BYTES,
    multiple: false,
    noClick: !!file,
    noKeyboard: !!file,
  });

  const meta = DOC_LABELS[docType];

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium">
        {meta.title}
        <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
      </Label>
      <div
        {...getRootProps()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-3.5 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : file
              ? "border-secondary/50 bg-secondary/5 cursor-default"
              : "border-border bg-muted/20 hover:border-primary/40",
        )}
      >
        <input {...getInputProps()} aria-label={`Upload ${meta.title}`} />
        {file ? (
          <div className="flex w-full items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary/15 text-secondary">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type || "file"}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(undefined);
              }}
              aria-label="Remove file"
              className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                open();
              }}
              className="shrink-0 text-xs font-medium text-primary hover:underline"
            >
              Replace
            </button>
          </div>
        ) : (
          <>
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Upload className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {isDragActive ? "Drop the file here" : "Drag & drop, or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground">{meta.helper}</p>
          </>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <FileText className="size-3" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
