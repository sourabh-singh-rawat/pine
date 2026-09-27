export interface ThumbnailDimensions {
  width: number;
  height: number;
}

export type ThumbnailSizeName = "thumbnail" | "preview";

export const THUMBNAIL_SIZES: Record<ThumbnailSizeName, ThumbnailDimensions> = {
  thumbnail: { width: 250, height: 250 },
  preview: { width: 1200, height: 1200 },
};
