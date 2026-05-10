import type { NextRequest } from "next/server";
import { requireRole } from "@/utils/auth.utils";
import {
  uploadDocuments,
  type DocumentUploadInput,
} from "@/services/driver.service";
import { ok, handleError } from "@/utils/api-response.utils";
import { ValidationError } from "@/utils/errors";
import { DOCUMENT_TYPES } from "@/lib/constants/enums";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireRole(req, "driver");

    const formData = await req.formData();
    const files: DocumentUploadInput = {};
    let provided = 0;

    for (const docType of DOCUMENT_TYPES) {
      const value = formData.get(docType);
      if (value instanceof File && value.size > 0) {
        files[docType] = value;
        provided += 1;
      }
    }

    if (provided === 0) {
      throw new ValidationError(
        `Provide at least one of: ${DOCUMENT_TYPES.join(", ")}`
      );
    }

    const result = await uploadDocuments(auth.id, files);
    return ok(
      {
        profile: result.profile,
        uploaded: result.uploaded,
      },
      "Documents uploaded"
    );
  } catch (e) {
    return handleError(e);
  }
}
