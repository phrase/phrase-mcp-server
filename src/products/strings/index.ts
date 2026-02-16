import { ProductModule } from "../types.js";
import { StringsClient } from "./client.js";
import { registerListKeysTool } from "./tools/list-keys.js";
import { registerListLocalesTool } from "./tools/list-locales.js";
import { registerListProjectsTool } from "./tools/list-projects.js";
import { registerListTranslationsTool } from "./tools/list-translations.js";

export const stringsModule: ProductModule = {
  key: "strings",
  client: {
    defaultBaseUrl: "https://api.phrase.com/v2",
    defaultAuthPrefix: "token",
    baseUrlEnvAliases: ["PHRASE_BASE_URL"],
    createClient: (options) => new StringsClient(options),
  },
  register(server, runtime) {
    registerListProjectsTool(server, runtime);
    registerListLocalesTool(server, runtime);
    registerListKeysTool(server, runtime);
    registerListTranslationsTool(server, runtime);
  },
};
