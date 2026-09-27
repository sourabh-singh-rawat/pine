export interface ThumbnailDimensions {
  width: number;
  height: number;
}

export type ThumbnailSizeName = "thumbnail" | "preview";

export const THUMBNAIL_SIZES: Record<ThumbnailSizeName, ThumbnailDimensions> = {
  thumbnail: { width: 256, height: 256 },
  preview: { width: 1200, height: 1200 },
};
