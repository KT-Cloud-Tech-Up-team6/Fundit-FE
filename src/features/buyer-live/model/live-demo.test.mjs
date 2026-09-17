import assert from "node:assert/strict";
import test from "node:test";
import {
  getLiveDemoConnection,
  getProjectDemoConnection,
  getUpcomingProjectHref,
} from "./live-demo.ts";

test("예정 카드의 프로젝트가 같은 상품과 방송 관계를 유지한다", () => {
  for (const id of ["scheduled-1", "follow-2", "subscribed-3", "recommended-30"]) {
    const connection = getLiveDemoConnection(id, true);
    const project = getProjectDemoConnection(connection.projectId);
    assert.equal(project.data.title, connection.data.title);
    assert.equal(project.hasLive, false);
    assert.equal(getUpcomingProjectHref(id), `/projects/${project.projectId}?tab=story`);
    assert.deepEqual(getLiveDemoConnection(project.liveId), project);
  }
});

test("방송과 상세의 왕복 관계를 유지하고 알 수 없는 ID는 연결하지 않는다", () => {
  for (const id of ["demo-live", "new-1", "rank-4", "follow-1", "recommended-30"]) {
    const connection = getLiveDemoConnection(id);
    assert.equal(connection.hasLive, true);
    assert.deepEqual(getProjectDemoConnection(connection.projectId), connection);
  }
  for (const id of ["unknown", "rank-0", "rank-31", "new-1-extra"]) {
    assert.equal(getLiveDemoConnection(id), undefined);
  }
  assert.equal(getProjectDemoConnection("unknown"), undefined);
});
