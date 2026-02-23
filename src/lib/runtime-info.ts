import packageJson from "#package.json" with { type: "json" };

export const APP_NAME: string = packageJson.name;
export const APP_VERSION: string = packageJson.version;
export const GLOBAL_USER_AGENT = `${APP_NAME}/${APP_VERSION}`;
