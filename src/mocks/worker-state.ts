/* msw를 import하지 않는 상태 모듈이다. MswProvider가 정적으로 읽어도 운영 번들에 msw가 들어가지 않는다. */
let started = false;

export function isMockWorkerStarted() {
  return started;
}

export function markMockWorkerStarted() {
  started = true;
}
