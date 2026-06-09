import { FileCategory } from "./types";

export const FILE_CATEGORIES: FileCategory[] = [
  {
    id: "image",
    nameKey: "categoryImage",
    replacement: "image",
    extensions: ["png", "jpg", "jpeg", "gif", "webp", "svg", "heic", "bmp", "tiff"],
  },
  {
    id: "video",
    nameKey: "categoryVideo",
    replacement: "video",
    extensions: ["mp4", "mov", "avi", "mkv", "webm", "flv"],
  },
  {
    id: "audio",
    nameKey: "categoryAudio",
    replacement: "audio",
    extensions: ["mp3", "m4a", "wav", "flac", "ogg", "aac"],
  },
  {
    id: "document",
    nameKey: "categoryDocument",
    replacement: "markdown",
    extensions: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "epub", "txt", "csv"],
  },
];

export function getCategoryForExt(ext: string): FileCategory | undefined {
  const normalized = ext.toLowerCase();
  return FILE_CATEGORIES.find((cat) => cat.extensions.includes(normalized));
}

export function getAllKnownExtensions(): string[] {
  return FILE_CATEGORIES.flatMap((cat) => cat.extensions);
}
