import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { asTextContent } from "#lib/mcp";
import type { ProductRuntime } from "#products/types";

export function registerEmailQuotesTool(server: McpServer, runtime: ProductRuntime<"tms">) {
  server.registerTool(
    "tms_email_quotes",
    {
      description:
        "Email one or more quotes to recipients from Phrase TMS. Returns the list of recipient email addresses the quotes were sent to. (POST /api2/v1/quotes/email)",
      annotations: { title: "[TMS] Email Quotes", destructiveHint: true },
      inputSchema: {
        body: z.string().min(1).describe("Email body text."),
        quotes: z
          .array(z.object({ uid: z.string().min(1) }))
          .min(1)
          .describe("Array of quote objects with uid to include in the email."),
        subject: z.string().min(1).describe("Email subject line."),
        bcc: z.string().optional().describe("BCC email address."),
        cc: z.string().optional().describe("CC email address."),
      },
    },
    async ({ body, quotes, subject, bcc, cc }) => {
      const payload: Record<string, unknown> = { body, quotes, subject };
      if (bcc) payload.bcc = bcc;
      if (cc) payload.cc = cc;
      const result = await runtime.client.postJson("/v1/quotes/email", payload);
      return asTextContent(result);
    },
  );
}
