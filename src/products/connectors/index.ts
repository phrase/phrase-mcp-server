import type { ProductModule } from "#products/types";
import { ConnectorsClient } from "#products/connectors/client";
import { registerDownloadRawTool } from "#products/connectors/tools/download-raw";
import { registerListConnectorsTool } from "#products/connectors/tools/list-connectors";
import { registerListContentTool } from "#products/connectors/tools/list-content";
import { registerUploadRawTool } from "#products/connectors/tools/upload-raw";

export const connectorsModule: ProductModule<"connectors"> = {
  key: "connectors",
  client: {
    defaultBaseUrlsByRegion: {
      eu: "https://eu.phrase.com/connectors",
      us: "https://us.phrase.com/connectors",
    },
    defaultAuthPrefix: "Bearer",
    allowBaseUrlOverride: false,
    tokenEnvAliases: ["PHRASE_BIFROST_TOKEN"],
    createClient: (options) => new ConnectorsClient(options),
  },
  register(server, runtime) {
    registerListConnectorsTool(server, runtime);
    registerListContentTool(server, runtime);
    registerDownloadRawTool(server, runtime);
    registerUploadRawTool(server, runtime);
  },
};
