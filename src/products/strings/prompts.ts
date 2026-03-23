import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerStringsPrompts(server: McpServer) {
  server.registerPrompt(
    "strings_find_missing_translations",
    {
      description:
        "Find all translation keys in a Phrase Strings project that are missing translations for a given locale.",
      argsSchema: {
        project_id: z.string().min(1).describe("The project ID to audit"),
        locale_id: z.string().min(1).describe("The locale ID to check for missing translations"),
        branch: z.string().optional().describe("Branch to check (defaults to main branch)"),
      },
    },
    ({ project_id, locale_id, branch }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Find all translation keys in Phrase Strings project \`${project_id}\` that are missing translations for locale \`${locale_id}\`.`,
              branch ? `Use branch: \`${branch}\`.` : "",
              "",
              "Steps:",
              "1. Use `strings_list_keys` to retrieve all keys in the project.",
              "2. Use `strings_list_translations` with the given locale_id to get all existing translations.",
              "3. Compare the two lists and identify keys that have no translation for that locale.",
              "4. Present the results as a clear list of missing key names, grouped by tag if tags are available.",
              "5. Include a summary count: total keys, translated, and missing.",
            ]
              .filter((line) => line !== undefined)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "strings_review_job",
    {
      description:
        "Review the status and progress of a translation job in Phrase Strings, including locale-level completion.",
      argsSchema: {
        project_id: z.string().min(1).describe("The project ID the job belongs to"),
        job_id: z.string().min(1).describe("The job ID to review"),
      },
    },
    ({ project_id, job_id }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Review the translation job \`${job_id}\` in Phrase Strings project \`${project_id}\`.`,
              "",
              "Steps:",
              "1. Use `strings_get_job` to fetch the job details (name, status, due date, source locale).",
              "2. Use `strings_list_job_locales` to list all target locales and their individual statuses.",
              "3. Use `strings_list_job_comments` to surface any comments or blockers on the job.",
              "4. Summarise the overall job status, which locales are complete / in progress / not started, any overdue locales, and any open comments.",
            ].join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "strings_export_locale",
    {
      description:
        "Export (download) a locale from a Phrase Strings project in a specified file format.",
      argsSchema: {
        project_id: z.string().min(1).describe("The project ID to export from"),
        locale_id: z.string().min(1).describe("The locale ID to export"),
        file_format: z
          .string()
          .min(1)
          .describe(
            "File format to export (e.g. json, yaml, xml, strings). Use strings_list_formats to see available formats.",
          ),
        branch: z.string().optional().describe("Branch to export from (defaults to main branch)"),
      },
    },
    ({ project_id, locale_id, file_format, branch }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Export locale \`${locale_id}\` from Phrase Strings project \`${project_id}\` in \`${file_format}\` format.`,
              branch ? `Use branch: \`${branch}\`.` : "",
              "",
              "Steps:",
              "1. Use `strings_create_locale_download` to initiate the export with the specified locale_id, file_format, and branch.",
              "2. Use `strings_get_locale_download` with the returned ID to poll the download status.",
              "3. Repeat step 2 until the status is `success` (or report an error if it fails).",
              "4. Return the download URL or content to the user.",
            ]
              .filter((line) => line !== undefined)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "strings_upload_translations",
    {
      description:
        "Upload a translation file to a Phrase Strings project for a specific locale and verify the result.",
      argsSchema: {
        project_id: z.string().min(1).describe("The project ID to upload to"),
        locale_id: z.string().min(1).describe("The locale the file contains translations for"),
        file_path: z.string().min(1).describe("Local path to the translation file to upload"),
        file_format: z
          .string()
          .min(1)
          .describe("Format of the file (e.g. json, yaml, xml, strings)"),
        branch: z.string().optional().describe("Branch to upload to (defaults to main branch)"),
      },
    },
    ({ project_id, locale_id, file_path, file_format, branch }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Upload the translation file at \`${file_path}\` to Phrase Strings project \`${project_id}\` for locale \`${locale_id}\` using format \`${file_format}\`.`,
              branch ? `Use branch: \`${branch}\`.` : "",
              "",
              "Steps:",
              "1. Use `strings_create_upload` with the file path, locale_id, file_format, and branch to upload the file.",
              "2. Use `strings_get_upload` with the returned upload ID to check the processing status.",
              "3. Repeat step 2 until the status is `success` or `error`.",
              "4. Report a summary: how many keys were created, updated, or had errors.",
            ]
              .filter((line) => line !== undefined)
              .join("\n"),
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "strings_check_glossary_compliance",
    {
      description:
        "Check a piece of text or a set of translations against a Phrase Strings glossary (term base) to verify correct and consistent term usage.",
      argsSchema: {
        account_id: z.string().min(1).describe("The account ID that owns the glossary"),
        glossary_id: z.string().min(1).describe("The glossary (term base) ID to check against"),
        text: z
          .string()
          .min(1)
          .describe(
            "The text or translations to check. Can be a single string, a JSON object of key-value pairs, or multiple lines of translated content.",
          ),
        target_locale: z
          .string()
          .optional()
          .describe(
            "The locale of the text being checked (e.g. de, fr). Helps determine which terms should be translated vs. kept as-is.",
          ),
      },
    },
    ({ account_id, glossary_id, text, target_locale }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Check the following text for glossary compliance against glossary \`${glossary_id}\` in account \`${account_id}\`.`,
              target_locale ? `Target locale: \`${target_locale}\`.` : "",
              "",
              "Steps:",
              "1. Use `strings_list_glossary_terms` to fetch all terms from the glossary.",
              "2. For each term, note its properties: whether it is translatable, case-sensitive, and any description.",
              "3. Check the text below against each term:",
              "   - Non-translatable terms must appear verbatim (unchanged) in the translation.",
              "   - Case-sensitive terms must match exactly in the expected casing.",
              "   - Translatable terms should be consistently translated — flag if the same term appears translated differently in multiple places.",
              "4. Report your findings as:",
              "   - **Violations**: term misuse that must be fixed (e.g. non-translatable term was translated, wrong casing).",
              "   - **Warnings**: inconsistencies worth reviewing (e.g. term translated in two different ways).",
              "   - **Passed**: terms that are used correctly.",
              "",
              "Text to check:",
              "```",
              text,
              "```",
            ]
              .filter((line) => line !== undefined)
              .join("\n"),
          },
        },
      ],
    }),
  );
}
