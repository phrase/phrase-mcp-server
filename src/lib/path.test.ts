import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveSafeLocalPath } from "#lib/path";

describe("resolveSafeLocalPath", () => {
  it("resolves relative paths within the working directory", () => {
    const safePath = resolveSafeLocalPath(join("downloads", "demo.txt"));

    expect(safePath).toBe(resolve("downloads", "demo.txt"));
  });

  it("rejects paths that escape the working directory", () => {
    expect(() => resolveSafeLocalPath("../../../etc/passwd")).toThrow(
      "Invalid path: path must resolve within the current working directory.",
    );
  });

  it("rejects absolute paths outside the working directory", () => {
    expect(() => resolveSafeLocalPath("/etc/passwd")).toThrow(
      "Invalid path: path must resolve within the current working directory.",
    );
  });

  it("rejects null bytes in paths", () => {
    expect(() => resolveSafeLocalPath("downloads\0/passwd")).toThrow(
      "Invalid path: path must resolve within the current working directory.",
    );
  });
});
