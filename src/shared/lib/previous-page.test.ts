import assert from "node:assert/strict";
import test from "node:test";
import { previousPage } from "./previous-page";

test("in-range pages step back one page", () => {
  assert.equal(previousPage(2, { totalPages: 2 }), 1);
  assert.equal(previousPage(3, { totalPages: 5 }), 2);
  assert.equal(previousPage(2, { totalElements: 25, pageSize: 20 }), 1);
});

test("pages beyond the last page go to the last existing page", () => {
  assert.equal(previousPage(99, { totalPages: 2 }), 2);
  assert.equal(previousPage(99, { totalElements: 25, pageSize: 20 }), 2);
  assert.equal(previousPage(3, { totalElements: 21, pageSize: 20 }), 2);
});

test("an empty list goes to the first page", () => {
  assert.equal(previousPage(5, { totalPages: 0 }), 1);
  assert.equal(previousPage(5, { totalElements: 0, pageSize: 20 }), 1);
  assert.equal(previousPage(2, { totalElements: 0, pageSize: 20 }), 1);
});

test("an exact multiple of the page size has no extra page", () => {
  assert.equal(previousPage(3, { totalElements: 40, pageSize: 20 }), 2);
  assert.equal(previousPage(2, { totalElements: 40, pageSize: 20 }), 1);
});
