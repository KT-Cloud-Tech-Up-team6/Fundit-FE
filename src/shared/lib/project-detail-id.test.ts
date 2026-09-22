import assert from "node:assert/strict";
import test from "node:test";
import { projectDetailId } from "./project-detail-id";

test("valid public UUIDs pass through unchanged", () => {
  for (const uuid of [
    "11111111-2222-4333-8444-555555555555",
    "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
  ]) {
    assert.equal(projectDetailId(uuid), uuid);
  }
});

test("missing, malformed, numeric and path-like values never enable detail", () => {
  for (const value of [
    undefined,
    null,
    "",
    "   ",
    42,
    "42",
    "project-42",
    "../admin",
    "11111111-2222-4333-8444-555555555555?tab=story",
    "11111111-2222-4333-8444-55555555555",
    "11111111222243338444555555555555",
  ]) {
    assert.equal(projectDetailId(value), null);
  }
});
