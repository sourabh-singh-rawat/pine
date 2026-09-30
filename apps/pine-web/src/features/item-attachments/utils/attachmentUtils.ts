export const formatFileSize = (size: number | null | undefined): string => {
  if (size === null || size === undefined || size <= 0) {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const isImageMimeType = (mimeType: string): boolean =>
  mimeType.toLowerCase().startsWith("image/");

export const isPdfAttachment = (mimeType: string, name: string): boolean => {
  if (mimeType.toLowerCase() === "application/pdf") {
    return true;
  }
  return name.toLowerCase().endsWith(".pdf");
};
