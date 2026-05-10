import {
  ALLOWED_DOCUMENT_MIME_TYPES,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/constants/enums";
import { ValidationError } from "@/utils/errors";

export type AllowedDocumentMimeType = (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number];

export function isAllowedDocumentMime(
  mime: string
): mime is AllowedDocumentMimeType {
  return (ALLOWED_DOCUMENT_MIME_TYPES as readonly string[]).includes(mime);
}

export function assertValidDocumentFile(file: File, fieldName: string): void {
  if (file.size <= 0) {
    throw new ValidationError(`${fieldName} is empty`);
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new ValidationError(
      `${fieldName} exceeds the ${MAX_DOCUMENT_SIZE_BYTES / (1024 * 1024)} MB limit`
    );
  }
  if (!isAllowedDocumentMime(file.type)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${ALLOWED_DOCUMENT_MIME_TYPES.join(", ")}`
    );
  }
}
