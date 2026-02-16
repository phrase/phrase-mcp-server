import { z } from "zod";

const scalarQueryValue = z.union([z.string(), z.number(), z.boolean()]);

export const querySchema = z
  .record(z.union([scalarQueryValue, z.array(scalarQueryValue)]))
  .optional()
  .describe(
    "Raw query parameters passed through to the TMS endpoint. Use arrays for repeated params (for example statuses/jobStatuses). Common pagination keys are pageNumber (0-based) and pageSize.",
  );

export const paginationControlsSchema = {
  paginate: z
    .boolean()
    .optional()
    .describe("If true, fetch multiple pages and aggregate items into one response."),
  page_size: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Page size used for auto-pagination (maps to pageSize)."),
  max_pages: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Maximum pages to fetch when paginate=true."),
  max_items: z
    .number()
    .int()
    .min(1)
    .max(5000)
    .optional()
    .describe("Maximum items to return when paginate=true."),
} as const;
