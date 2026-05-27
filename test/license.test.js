import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("LICENSE matches Zed Apache 2.0 validator URL requirement", async () => {
  const license = await readFile("LICENSE", "utf8");

  assert.match(license, /http:\/\/www\.apache\.org\/licenses\//i);
});
