import {
  Configuration,
  KeysApi,
  LocalesApi,
  ProjectsApi,
  TranslationsApi,
} from "phrase-js";
import { ProductClientFactoryOptions } from "../types.js";

export class StringsClient {
  readonly projectsApi: ProjectsApi;
  readonly localesApi: LocalesApi;
  readonly keysApi: KeysApi;
  readonly translationsApi: TranslationsApi;

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
  }
}
