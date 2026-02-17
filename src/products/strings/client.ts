import {
  Configuration,
  FormatsApi,
  GlossariesApi,
  GlossaryTermTranslationsApi,
  GlossaryTermsApi,
  JobCommentsApi,
  JobTemplateLocalesApi,
  JobTemplatesApi,
  JobLocalesApi,
  JobsApi,
  KeysApi,
  LocalesApi,
  ProjectsApi,
  TranslationsApi,
} from "phrase-js";
import type { ProductClientFactoryOptions } from "../types.js";

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

  constructor(options: ProductClientFactoryOptions) {
    const authPrefix = options.authPrefix.trim();
    const apiKeyValue = authPrefix ? `${authPrefix} ${options.authToken}` : options.authToken;

    const configuration = new Configuration({
      basePath: options.baseUrl,
      apiKey: apiKeyValue,
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
  }
}
