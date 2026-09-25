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

export const getAttachmentUrl = (attachmentId: string): string => {
  const base =
    import.meta.env.VITE_DATA_GATEWAY_URL ??
    import.meta.env.VITE_API_BASE_URL ??
    "https://localhost:4001";
  return `${base.replace(/\/$/, "")}/attachments/${attachmentId}`;
};
