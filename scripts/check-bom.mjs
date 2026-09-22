import { execFileSync } from "node:child_process";
import { closeSync, openSync, readSync } from "node:fs";

/* 추적 파일이 UTF-8 BOM(EF BB BF)으로 시작하지 않는지 검사한다.
   Prettier는 BOM을 보존하므로 format:check로는 걸러지지 않는다(#260). */

const files = execFileSync("git", ["ls-files", "-z"]).toString("utf8").split("\0").filter(Boolean);

const offenders = [];
for (const file of files) {
  let descriptor;
  try {
    descriptor = openSync(file, "r");
  } catch {
    // 인덱스에는 있으나 작업 트리에 없는 파일(삭제 대기 등)은 건너뛴다.
    continue;
  }
  const head = Buffer.alloc(3);
  let read = 0;
  try {
    read = readSync(descriptor, head, 0, 3, 0);
  } finally {
    closeSync(descriptor);
  }
  if (read === 3 && head[0] === 0xef && head[1] === 0xbb && head[2] === 0xbf) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error("UTF-8 BOM으로 시작하는 추적 파일이 있습니다. 선두 3바이트를 제거해주세요.");
  for (const file of offenders) console.error(`  ${file}`);
  process.exit(1);
}
