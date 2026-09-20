import test from "node:test";
import assert from "node:assert/strict";
import { uploadProjectMedia, ProjectMediaValidationError } from "./media-api.ts";

const file = (name, type, size = 1) =>
  Object.defineProperty(new File(["x"], name, { type }), "size", { value: size });

test("media rejects unsupported, empty, mismatched and oversized files before HTTP", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", () => {
    throw new Error("must not upload");
  });
  for (const item of [
    file("a.gif", "image/gif"),
    file("a.svg", "image/svg+xml"),
    file("a.png", "image/jpeg"),
    file("a.png", "image/png", 0),
    file("a.png", "image/png", 10 * 1024 ** 2 + 1),
    file("a.mp4", "video/mp4", 100 * 1024 ** 2 + 1),
  ]) {
    await assert.rejects(uploadProjectMedia("project", item), ProjectMediaValidationError);
  }
  await assert.rejects(
    uploadProjectMedia("project", file("a.mp4", "video/mp4"), "image"),
    /JPG·PNG·WebP/,
  );
  for (const [name, type] of [
    ["a.jpg", "image/jpeg"],
    ["a.png", "image/png"],
    ["a.webp", "image/webp"],
  ]) {
    await assert.rejects(uploadProjectMedia("project", file(name, type), "video"), /MP4/);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("valid media at the size limits use signed PUT without credentials", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return url.startsWith("/api/")
      ? Response.json({ uploadUrl: "https://upload.test/signed", fileUrl: "https://cdn.test/file" })
      : new Response(null, { status: 200 });
  });
  for (const [item, kind] of [
    [file("a.JPG", "image/jpeg", 10 * 1024 ** 2), "image"],
    [file("a.png", "image/png"), "image"],
    [file("a.webp", "image/webp"), "image"],
    [file("a.mp4", "video/mp4", 100 * 1024 ** 2), "video"],
    [file("a.png", "image/png"), "media"],
    [file("a.mp4", "video/mp4"), "media"],
  ]) {
    assert.equal(await uploadProjectMedia("project", item, kind), "https://cdn.test/file");
    const upload = calls.at(-1);
    assert.equal(upload.init.method, "PUT");
    assert.equal(upload.init.credentials, "omit");
    assert.equal(upload.init.body, item);
  }
});

for (const [code, message] of [
  ["UNSUPPORTED_MEDIA_TYPE", "지원하지 않는 파일 형식"],
  ["MEDIA_TOO_LARGE", "파일 용량이 너무 큽니다"],
]) {
  test("server media rejection preserves an actionable message: " + code, async (t) => {
    t.mock.method(globalThis, "fetch", async () => Response.json({ code }, { status: 400 }));
    await assert.rejects(
      uploadProjectMedia("project", file("a.png", "image/png")),
      (error) => error instanceof ProjectMediaValidationError && error.message.includes(message),
    );
  });
}
