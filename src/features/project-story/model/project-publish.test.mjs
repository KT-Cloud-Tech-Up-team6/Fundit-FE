import assert from "node:assert/strict";
import test from "node:test";
import { missingPublishRequirements } from "./project-publish.ts";

test("reads the missing requirement keys from the submit error message", () => {
  assert.deepEqual(
    missingPublishRequirements(
      "필수 작성 항목이 완료되지 않았습니다: basicInfo, story, rewards, privacyConsent",
    ),
    ["basicInfo", "story", "rewards", "privacyConsent"],
  );
  assert.deepEqual(
    missingPublishRequirements("필수 작성 항목이 완료되지 않았습니다: privacyConsent"),
    ["privacyConsent"],
  );
});

test("ignores unknown keys and messages without a key list", () => {
  assert.deepEqual(
    missingPublishRequirements("필수 작성 항목이 완료되지 않았습니다: rewards, schedule"),
    ["rewards"],
  );
  assert.deepEqual(
    missingPublishRequirements("필수 작성 항목이 완료되지 않아 공개할 수 없습니다."),
    [],
  );
  assert.deepEqual(missingPublishRequirements("toString: constructor"), []);
});
