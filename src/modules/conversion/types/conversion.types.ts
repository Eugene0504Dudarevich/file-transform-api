export const SUPPORTED_FORMATS = ['csv', 'json', 'xml', 'yaml'] as const;

export type FileFormat = (typeof SUPPORTED_FORMATS)[number];
