import assert from "node:assert/strict";
import test from "node:test";
import { compactCount } from "./compact-count";

test("counts under a thousand are shown as they are", () => {
  assert.equal(compactCount(0), "0");
  assert.equal(compactCount(7), "7");
  assert.equal(compactCount(999), "999");
});

test("thousands keep one truncated decimal and drop .0", () => {
  assert.equal(compactCount(1000), "1천");
  assert.equal(compactCount(1050), "1천");
  assert.equal(compactCount(1100), "1.1천");
  assert.equal(compactCount(2400), "2.4천");
  assert.equal(compactCount(2401), "2.4천");
  assert.equal(compactCount(9999), "9.9천");
});

test("ten thousands switch to 만 with the same truncation", () => {
  assert.equal(compactCount(10000), "1만");
  assert.equal(compactCount(12345), "1.2만");
  assert.equal(compactCount(99999), "9.9만");
  assert.equal(compactCount(100000), "10만");
  assert.equal(compactCount(1234567), "123.4만");
  assert.equal(compactCount(123456789), "12,345.6만");
});
