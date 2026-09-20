import assert from "node:assert/strict";
import test from "node:test";
import {
  changePassword,
  confirmPasswordReset,
  findEmail,
  requestPasswordReset,
  revealEmail,
} from "./auth-api.ts";
import { authTokenStore } from "../../../shared/api/auth-token-store.ts";

test("recovery endpoints preserve nullable lookup and pass only contract fields", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url, ...options, body: JSON.parse(options.body) });
    return new Response(
      JSON.stringify(url.endsWith("find-email") ? { maskedEmail: null } : { message: "ok" }),
    );
  });
  const identity = { name: "홍길동", phoneNumber: "01012345678" };
  assert.deepEqual(await findEmail(identity), { maskedEmail: null });
  await revealEmail("verified");
  await requestPasswordReset({ ...identity, email: "a@b.test" });
  await confirmPasswordReset({ token: "one-time", newPassword: "Newpass1!" });
  authTokenStore.set("access");
  await changePassword({ currentPassword: "Oldpass1!", newPassword: "Newpass1!" });
  assert.deepEqual(
    calls.map(({ url }) => url),
    [
      "/api/v1/auth/find-email",
      "/api/v1/auth/find-email/reveal",
      "/api/v1/auth/reset-password",
      "/api/v1/auth/reset-password/confirm",
      "/api/v1/auth/password",
    ],
  );
  assert.deepEqual(calls[1].body, { verificationToken: "verified" });
  assert.deepEqual(calls[3].body, { token: "one-time", newPassword: "Newpass1!" });
  assert.equal(calls[4].method, "PATCH");
  assert.equal(new Headers(calls[4].headers).get("Authorization"), "Bearer access");
  assert.equal(new Headers(calls[0].headers).has("Authorization"), false);
  authTokenStore.clear();
});

test("expired reset token is returned as a structured error without automatic retry", async (t) => {
  let requests = 0;
  t.mock.method(globalThis, "fetch", async () => {
    requests++;
    return new Response(JSON.stringify({ code: "TOKEN_INVALID", message: "expired" }), {
      status: 401,
    });
  });
  await assert.rejects(confirmPasswordReset({ token: "expired", newPassword: "Newpass1!" }), {
    code: "TOKEN_INVALID",
    status: 401,
  });
  assert.equal(requests, 1);
});
