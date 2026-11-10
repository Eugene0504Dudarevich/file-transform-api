export const IMAGE_FORMATS = ['png', 'jpeg', 'svg'] as const;

export const IMAGE_TARGET_FORMATS = ['png', 'jpeg'] as const;

export type ImageFormat = (typeof IMAGE_FORMATS)[number];

export type RasterImageFormat = (typeof IMAGE_TARGET_FORMATS)[number];

export const IMAGE_CONVERSIONS = [
  {
    source: 'png',
    target: ['jpeg'],
  },
  {
    source: 'jpeg',
    target: ['png'],
  },
  {
    source: 'svg',
    target: ['png', 'jpeg'],
  },
] as const;
