import {
  Configuration,
  FormatsApi,
  GlossariesApi,
  GlossaryTermTranslationsApi,
  GlossaryTermsApi,
  JobCommentsApi,
  JobLocalesApi,
  JobTemplateLocalesApi,
  JobTemplatesApi,
  JobsApi,
  KeysApi,
  LocaleDownloadsApi,
  LocalesApi,
  type Middleware,
  ProjectsApi,
  TranslationsApi,
  UploadsApi,
} from "phrase-js";
import { UnifiedAccessTokenProvider } from "#lib/auth.js";
import { GLOBAL_USER_AGENT } from "#lib/runtime-info.js";
import type { ProductClientFactoryOptions } from "#products/types.js";

export class StringsClient {
  readonly projectsApi: ProjectsApi;
  readonly localesApi: LocalesApi;
  readonly keysApi: KeysApi;
  readonly translationsApi: TranslationsApi;
  readonly formatsApi: FormatsApi;
  readonly glossariesApi: GlossariesApi;
  readonly glossaryTermsApi: GlossaryTermsApi;
  readonly glossaryTermTranslationsApi: GlossaryTermTranslationsApi;
  readonly jobsApi: JobsApi;
  readonly jobTemplatesApi: JobTemplatesApi;
  readonly jobTemplateLocalesApi: JobTemplateLocalesApi;
  readonly jobLocalesApi: JobLocalesApi;
  readonly jobCommentsApi: JobCommentsApi;
  readonly localeDownloadsApi: LocaleDownloadsApi;
  readonly uploadsApi: UploadsApi;

  constructor(options: ProductClientFactoryOptions) {
    const authHeader = options.authHeader.trim() || "Authorization";
    const configuredAuthPrefix = options.authPrefix.trim();
    const userAgent = GLOBAL_USER_AGENT;
    const useStaticTokenAuth = configuredAuthPrefix.toLowerCase() === "token";
    const tokenProvider = useStaticTokenAuth
      ? null
      : new UnifiedAccessTokenProvider(options.authToken, options.region);
    const authMiddleware: Middleware = {
      pre: async (context) => {
        const token = useStaticTokenAuth
          ? options.authToken
          : await tokenProvider!.getAccessToken();
        const authPrefix = useStaticTokenAuth ? configuredAuthPrefix : "Bearer";
        const authValue = authPrefix ? `${authPrefix} ${token}` : token;
        const headers = new Headers((context.init.headers as HeadersInit | undefined) ?? {});
        headers.set(authHeader, authValue);
        headers.set("User-Agent", userAgent);

        return {
          url: context.url,
          init: {
            ...context.init,
            headers: Object.fromEntries(headers.entries()),
          },
        };
      },
    };

    const configuration = new Configuration({
      basePath: options.baseUrl,
      middleware: [authMiddleware],
      fetchApi: globalThis.fetch,
    });

    this.projectsApi = new ProjectsApi(configuration);
    this.localesApi = new LocalesApi(configuration);
    this.keysApi = new KeysApi(configuration);
    this.translationsApi = new TranslationsApi(configuration);
    this.formatsApi = new FormatsApi(configuration);
    this.glossariesApi = new GlossariesApi(configuration);
    this.glossaryTermsApi = new GlossaryTermsApi(configuration);
    this.glossaryTermTranslationsApi = new GlossaryTermTranslationsApi(configuration);
    this.jobsApi = new JobsApi(configuration);
    this.jobTemplatesApi = new JobTemplatesApi(configuration);
    this.jobTemplateLocalesApi = new JobTemplateLocalesApi(configuration);
    this.jobLocalesApi = new JobLocalesApi(configuration);
    this.jobCommentsApi = new JobCommentsApi(configuration);
    this.localeDownloadsApi = new LocaleDownloadsApi(configuration);
    this.uploadsApi = new UploadsApi(configuration);
  }
}
