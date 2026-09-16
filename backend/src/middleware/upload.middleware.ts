import multer from "multer";

import { ApiError } from "../utils/api-error";

const MAX_FILE_SIZE =
  10 * 1024 * 1024;

const allowedMimeTypes =
  new Set([
    "application/pdf",

    "image/jpeg",
    "image/png",
    "image/webp",

    "text/plain",

    "application/msword",

    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-excel",

    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]);

const storage =
  multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },

  fileFilter: (
    _req,
    file,
    callback,
  ) => {
    if (
      !allowedMimeTypes.has(
        file.mimetype.toLowerCase(),
      )
    ) {
      callback(
        new ApiError(
          400,
          "Unsupported file type.",
          "UNSUPPORTED_FILE_TYPE",
        ),
      );

      return;
    }

    callback(null, true);
  },
});

export const uploadDocumentFile =
  upload.single("file");