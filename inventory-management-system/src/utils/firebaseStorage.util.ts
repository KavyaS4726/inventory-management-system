import { getBucket } from "../config/firebase";
import { v4 as uuidv4 } from "uuid";

export const uploadFileToStorage = async (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  const bucket = getBucket();
  const fileName = `${folder}/${uuidv4()}-${file.originalname}`;
  const fileUpload = bucket.file(fileName);

  await fileUpload.save(file.buffer, {
    metadata: { contentType: file.mimetype },
  });

  await fileUpload.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};

export const uploadMultipleFilesToStorage = async (
  files: Express.Multer.File[],
  folder: string
): Promise<string[]> => {
  const uploadPromises = files.map((file) => uploadFileToStorage(file, folder));
  return Promise.all(uploadPromises);
};