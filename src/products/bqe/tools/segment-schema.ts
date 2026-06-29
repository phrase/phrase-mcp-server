import { z } from "zod";

export const segmentSchema = z.object({
  id: z.string().optional().describe("Optional identifier for the segment."),
  source: z.string().describe("Source text that was translated."),
  target: z.string().describe("Translated text to evaluate."),
});
