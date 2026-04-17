import { afterEach, describe, expect, it, vi } from "vitest";

describe("getGeminiApiKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("trims quotes and whitespace from the Gemini env value", async () => {
    vi.stubEnv("API_KEY", '  "AIza-test-key"  ');

    const { getGeminiApiKey } = await import("./env");

    expect(getGeminiApiKey()).toBe("AIza-test-key");
  });
});
