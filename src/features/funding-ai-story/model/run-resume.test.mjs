import assert from "node:assert/strict";
import test from "node:test";
import { resolveFundingStoryRunId } from "./run-resume.ts";

test("수락된 run ID가 있으면 새 생성 요청 없이 같은 작업을 사용한다", async () => {
  let createCount = 0;
  const runId = await resolveFundingStoryRunId("accepted-run", async () => {
    createCount += 1;
    return { run_id: "duplicate-run" };
  });

  assert.equal(runId, "accepted-run");
  assert.equal(createCount, 0);
});

test("수락된 run ID가 없을 때만 새 생성 작업을 요청한다", async () => {
  let createCount = 0;
  const runId = await resolveFundingStoryRunId(null, async () => {
    createCount += 1;
    return { run_id: "new-run" };
  });

  assert.equal(runId, "new-run");
  assert.equal(createCount, 1);
});
