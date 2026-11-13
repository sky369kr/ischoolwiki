import { describe, expect, it, vi } from "vitest";
import { isTransient, retryOnce } from "../src/retry";

const apiError = (status: number, message = "error") => Object.assign(new Error(message), { status });

describe("isTransient", () => {
  it("treats overload, rate limits and server errors as worth one more try", () => {
    expect(isTransient(apiError(503, "credential validation failed"))).toBe(true);
    expect(isTransient(apiError(529, "overloaded"))).toBe(true);
    expect(isTransient(apiError(429))).toBe(true);
    expect(isTransient(new Error("Request timed out."))).toBe(true);
  });

  it("does not retry a request that will fail the same way", () => {
    expect(isTransient(apiError(400, "invalid request"))).toBe(false);
    expect(isTransient(apiError(401, "invalid x-api-key"))).toBe(false);
    expect(isTransient(new SyntaxError("Unexpected token"))).toBe(false);
  });
});

describe("retryOnce", () => {
  it("waits and tries once more after a transient failure", async () => {
    const fn = vi.fn().mockRejectedValueOnce(apiError(503)).mockResolvedValueOnce("ok");
    const sleep = vi.fn().mockResolvedValue(undefined);
    await expect(retryOnce(fn, 30_000, sleep)).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(30_000);
  });

  it("gives up after the second failure, and does not retry a permanent one", async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const twice = vi.fn().mockRejectedValue(apiError(503));
    await expect(retryOnce(twice, 1, sleep)).rejects.toThrow();
    expect(twice).toHaveBeenCalledTimes(2);
    const permanent = vi.fn().mockRejectedValue(apiError(401));
    await expect(retryOnce(permanent, 1, sleep)).rejects.toThrow();
    expect(permanent).toHaveBeenCalledTimes(1);
  });
});
