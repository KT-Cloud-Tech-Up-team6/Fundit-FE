import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "@/shared/api/api-error";
import { toErrorStatus } from "./error-state";

test("ApiError status maps to the matching ErrorStatus", () => {
  const cases: Array<[number, string]> = [
    [404, "notFound"],
    [401, "unauthorized"],
    [403, "forbidden"],
    [500, "server"],
    [502, "server"],
  ];
  for (const [status, expected] of cases) {
    const error = new ApiError({ code: "E", message: "m", status });
    assert.equal(toErrorStatus(error), expected);
  }
});

test("TypeError (network disconnection) maps to network", () => {
  assert.equal(toErrorStatus(new TypeError("Failed to fetch")), "network");
});

test("unknown errors fall back to server", () => {
  assert.equal(toErrorStatus(new Error("boom")), "server");
  assert.equal(toErrorStatus("not an error"), "server");
  assert.equal(toErrorStatus(undefined), "server");
});
