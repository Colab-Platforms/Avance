import { cloudinary } from "../../config/cloudinary";
import { AppError } from "../../common/errors/AppError";

export function uploadPdfBuffer(buffer: Buffer, originalName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "avance-investor-documents",
        use_filename: true,
        unique_filename: true,
        filename_override: originalName,
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(502, "Failed to upload PDF to Cloudinary"));
          return;
        }
        resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
}
