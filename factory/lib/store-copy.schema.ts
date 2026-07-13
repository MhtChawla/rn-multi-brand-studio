import { z } from 'zod';

export const StoreCopy = z.object({
  title: z
    .string()
    .max(30)
    .describe('App name as shown on the store listing (max 30 chars)'),
  subtitle: z
    .string()
    .max(30)
    .describe('iOS subtitle / short tagline below the title (max 30 chars)'),
  description: z
    .string()
    .max(4000)
    .describe('Full app description shown on the product page (max 4000 chars)'),
  keywords: z
    .string()
    .max(100)
    .describe(
      'Comma-separated search keywords, no spaces after commas (max 100 chars total)',
    ),
  releaseNotes: z
    .string()
    .max(500)
    .describe("What's new in this version — shown in the update history (max 500 chars)"),
}).strict();

export type StoreCopyType = z.infer<typeof StoreCopy>;

export const StoreCopyOutput = z.object({
  de: StoreCopy,
  en: StoreCopy,
}).strict();

export type StoreCopyOutputType = z.infer<typeof StoreCopyOutput>;
