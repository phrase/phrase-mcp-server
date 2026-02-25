import {
  ALL_REGIONS,
  ALL_PRODUCTS,
  type AnyProductModule,
  type AnyProductRuntime,
  type Region,
  type ProductClientMap,
  type ProductClientFactoryOptions,
  type ProductKey,
  type ProductModule,
  type ProductRuntime,
  isRegion,
} from "#products/types.js";

function parseList(value: string | undefined): string[] {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseEnabledProducts(): Set<ProductKey> {
  const enabled = parseList(process.env.PHRASE_ENABLED_PRODUCTS);
  const disabled = new Set(parseList(process.env.PHRASE_DISABLED_PRODUCTS));

  const enabledSet =
    enabled.length === 0
      ? new Set<ProductKey>(ALL_PRODUCTS)
      : new Set(
          enabled.filter((product): product is ProductKey =>
            (ALL_PRODUCTS as readonly string[]).includes(product),
          ),
        );

  for (const product of disabled) {
    if ((ALL_PRODUCTS as readonly string[]).includes(product)) {
      enabledSet.delete(product as ProductKey);
    }
  }

  return enabledSet;
}

function envName(product: ProductKey, suffix: string): string {
  return `PHRASE_${product.toUpperCase()}_${suffix}`;
}

function getEnvValue(primary: string, aliases: string[] = []): string | undefined {
  const entry = getEnvValueWithSource(primary, aliases);
  return entry?.value;
}

function getEnvValueWithSource(
  primary: string,
  aliases: string[] = [],
): { name: string; value: string } | null {
  const names = [primary, ...aliases];
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return { name, value };
    }
  }
  return null;
}

const DEFAULT_REGION: Region = "eu";

function parseRegion(value: string, envVar: string): Region {
  const normalized = value.trim().toLowerCase();
  if (isRegion(normalized)) {
    return normalized; // properly narrowed to Region
  }

  throw new Error(`Unsupported ${envVar} '${value}'. Expected one of: ${ALL_REGIONS.join(", ")}.`);
}

function resolveRegion(product: ProductKey): Region {
  const regionEntry = getEnvValueWithSource(envName(product, "REGION"), ["PHRASE_REGION"]);
  if (regionEntry) {
    return parseRegion(regionEntry.value, regionEntry.name);
  }

  return DEFAULT_REGION;
}

async function getProductClient<K extends ProductKey>(
  module: ProductModule<K>,
): Promise<ProductClientMap[K] | null> {
  const product = module.key;
  const clientConfig = module.client;
  let region: Region;
  try {
    region = resolveRegion(product);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[phrase-mcp] Skipping product '${product}': ${message}`);
    return null;
  }

  const baseUrl =
    getEnvValue(envName(product, "BASE_URL"), clientConfig?.baseUrlEnvAliases ?? []) ??
    clientConfig?.defaultBaseUrlsByRegion?.[region] ??
    clientConfig?.defaultBaseUrl;
  const authTokenEntry = getEnvValueWithSource(
    envName(product, "TOKEN"),
    clientConfig?.tokenEnvAliases ?? [],
  );
  const authToken = authTokenEntry?.value;
  const authHeader = process.env[envName(product, "AUTH_HEADER")] ?? "Authorization";
  const authPrefixFromEnv = process.env[envName(product, "AUTH_PREFIX")];
  const authPrefix = authPrefixFromEnv ?? clientConfig?.defaultAuthPrefix ?? "Bearer";

  if (!baseUrl || !authToken) {
    const baseVars = [envName(product, "BASE_URL"), ...(clientConfig?.baseUrlEnvAliases ?? [])];
    const tokenVars = [envName(product, "TOKEN"), ...(clientConfig?.tokenEnvAliases ?? [])];
    console.error(
      `[phrase-mcp] Skipping product '${product}': missing one of [${baseVars.join(", ")}] or one of [${tokenVars.join(", ")}].`,
    );
    return null;
  }

  const options: ProductClientFactoryOptions<K> = {
    key: product,
    region,
    baseUrl,
    authHeader,
    authToken,
    authPrefix,
  };

  if (clientConfig?.createClient) {
    try {
      return await clientConfig.createClient(options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[phrase-mcp] Skipping product '${product}': ${message}`);
      return null;
    }
  }

  console.error(
    `[phrase-mcp] Skipping product '${product}': no client implementation configured yet.`,
  );
  return null;
}

async function loadTypedProductRuntime<K extends ProductKey>(
  productModule: ProductModule<K>,
): Promise<ProductRuntime<K> | null> {
  const client = await getProductClient(productModule);
  if (!client) {
    return null;
  }

  return {
    key: productModule.key,
    client,
  };
}

async function loadProductRuntime(
  productModule: AnyProductModule,
): Promise<AnyProductRuntime | null> {
  switch (productModule.key) {
    case "strings":
      return loadTypedProductRuntime(productModule);
    case "tms":
      return loadTypedProductRuntime(productModule);
  }
}

export async function loadProductRuntimes(
  productModules: AnyProductModule[],
): Promise<AnyProductRuntime[]> {
  const enabledProducts = parseEnabledProducts();
  const runtimes: AnyProductRuntime[] = [];

  for (const productModule of productModules) {
    if (!enabledProducts.has(productModule.key)) {
      continue;
    }

    const runtime = await loadProductRuntime(productModule);
    if (!runtime) {
      continue;
    }

    runtimes.push(runtime);
  }

  return runtimes;
}
