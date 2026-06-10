import { isAbsolute, relative, resolve } from "node:path";

const INVALID_PATH_MESSAGE =
  "Invalid path: path must resolve within the current working directory.";

export function resolveSafeLocalPath(path: string): string {
  if (path.includes("\0")) {
    throw new Error(INVALID_PATH_MESSAGE);
  }

  const absolutePath = resolve(path);
  const relativePath = relative(resolve("."), absolutePath);

  if (relativePath.startsWith("..") || isAbsolute(relativePath)) {
    throw new Error(INVALID_PATH_MESSAGE);
  }

  return absolutePath;
}
