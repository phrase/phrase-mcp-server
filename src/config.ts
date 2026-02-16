import {
  ALL_PRODUCTS,
  ProductClientFactoryOptions,
  ProductKey,
  ProductModule,
  ProductRuntime,
} from "./products/types.js";

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
      : new Set(enabled.filter((product): product is ProductKey =>
          (ALL_PRODUCTS as readonly string[]).includes(product),
        ));

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
  const names = [primary, ...aliases];
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }
  return undefined;
}

async function getProductClient(module: ProductModule): Promise<unknown | null> {
  const product = module.key;
  const clientConfig = module.client;
  const baseUrl = getEnvValue(
    envName(product, "BASE_URL"),
    clientConfig?.baseUrlEnvAliases ?? [],
  ) ?? clientConfig?.defaultBaseUrl;
  const authToken = getEnvValue(
    envName(product, "TOKEN"),
    clientConfig?.tokenEnvAliases ?? [],
  );
  const authHeader = process.env[envName(product, "AUTH_HEADER")] ?? "Authorization";
  const authPrefix =
    process.env[envName(product, "AUTH_PREFIX")] ??
    clientConfig?.defaultAuthPrefix ??
    "Bearer";

  if (!baseUrl || !authToken) {
    const baseVars = [envName(product, "BASE_URL"), ...(clientConfig?.baseUrlEnvAliases ?? [])];
    const tokenVars = [envName(product, "TOKEN"), ...(clientConfig?.tokenEnvAliases ?? [])];
    console.error(
      `[phrase-mcp] Skipping product '${product}': missing one of [${baseVars.join(", ")}] or one of [${tokenVars.join(", ")}].`,
    );
    return null;
  }

  const options: ProductClientFactoryOptions = {
    key: product,
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

export async function loadProductRuntimes(productModules: ProductModule[]): Promise<ProductRuntime[]> {
  const enabledProducts = parseEnabledProducts();
  const runtimes: ProductRuntime[] = [];
  const moduleByKey = new Map(productModules.map((module) => [module.key, module]));

  for (const key of ALL_PRODUCTS) {
    if (!enabledProducts.has(key)) {
      continue;
    }

    const productModule = moduleByKey.get(key);
    if (!productModule) {
      continue;
    }

    const client = await getProductClient(productModule);
    if (!client) {
      continue;
    }

    runtimes.push({ key, client });
  }

  return runtimes;
}
