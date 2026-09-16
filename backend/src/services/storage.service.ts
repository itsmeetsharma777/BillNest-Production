import {
  UploadApiResponse,
} from "cloudinary";

import cloudinary, {
  assertCloudinaryConfigured,
} from "../config/cloudinary";

import { ApiError } from "../utils/api-error";

interface UploadDocumentInput {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
}

export interface UploadedDocumentFile {
  url: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
}

function sanitizeFileName(
  fileName: string,
) {
  const extension =
    fileName.includes(".")
      ? fileName
          .split(".")
          .pop()
          ?.toLowerCase() ?? ""
      : "";

  const baseName =
    fileName
      .replace(
        /\.[^/.]+$/,
        "",
      )
      .replace(
        /[^a-zA-Z0-9-_]/g,
        "-",
      )
      .replace(
        /-+/g,
        "-",
      )
      .replace(
        /^-|-$/g,
        "",
      )
      .slice(0, 80);

  return extension
    ? `${baseName || "document"}.${extension}`
    : baseName || "document";
}

function getResourceType(
  mimeType: string,
): "image" | "raw" {
  return mimeType.startsWith(
    "image/",
  )
    ? "image"
    : "raw";
}

function uploadBuffer(
  buffer: Buffer,
  options: {
    folder: string;
    publicId: string;
    resourceType:
      | "image"
      | "raw";
    mimeType: string;
  },
): Promise<UploadApiResponse> {
  return new Promise(
    (resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder:
              options.folder,

            public_id:
              options.publicId,

            resource_type:
              options.resourceType,

            type: "upload",

            overwrite: false,

            use_filename: false,

            unique_filename: true,

            context: {
              original_name:
                options.mimeType,
            },
          },

          (
            error,
            result,
          ) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  "Cloudinary returned no upload result.",
                ),
              );

              return;
            }

            resolve(result);
          },
        );

      stream.end(buffer);
    },
  );
}

export async function uploadDocumentFileToStorage(
  input: UploadDocumentInput,
): Promise<UploadedDocumentFile> {
  assertCloudinaryConfigured();

  if (!input.buffer.length) {
    throw new ApiError(
      400,
      "Uploaded file is empty.",
      "EMPTY_FILE",
    );
  }

  const safeFileName =
    sanitizeFileName(
      input.originalName,
    );

  const baseName =
    safeFileName.replace(
      /\.[^/.]+$/,
      "",
    );

  const resourceType =
    getResourceType(
      input.mimeType,
    );

  const uploadResult =
    await uploadBuffer(
      input.buffer,
      {
        folder:
          "billnest/documents",

        publicId:
          `${baseName}-${Date.now()}`,

        resourceType,

        mimeType:
          input.mimeType,
      },
    );

  return {
    url:
      uploadResult.secure_url,

    storageKey:
      uploadResult.public_id,

    mimeType:
      input.mimeType,

    sizeBytes:
      input.buffer.length,
  };
}

export async function deleteDocumentFileFromStorage(
  storageKey: string,
  mimeType: string,
) {
  assertCloudinaryConfigured();

  if (!storageKey.trim()) {
    return;
  }

  const resourceType =
    getResourceType(
      mimeType,
    );

  await cloudinary.uploader.destroy(
    storageKey,
    {
      resource_type:
        resourceType,

      invalidate: true,
    },
  );
}