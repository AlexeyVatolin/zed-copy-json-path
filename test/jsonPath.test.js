import test from "node:test";
import assert from "node:assert/strict";

import { jsonPathAtOffset } from "../server/jsonPath.js";

test("returns dotted path for an object key", () => {
  const text = `{
  "a": {
    "b": 1
  }
}`;
  const offset = text.indexOf("\"b\"") + 1;

  assert.equal(jsonPathAtOffset(text, offset), "a.b");
});

test("uses bracket notation for array indexes", () => {
  const text = `{
  "a": [
    {
      "b": 1
    }
  ]
}`;
  const offset = text.indexOf("\"b\"") + 1;

  assert.equal(jsonPathAtOffset(text, offset), "a[0].b");
});

test("quotes property names that are not dot-safe", () => {
  const text = `{
  "a-b": {
    "spaced key": 1
  }
}`;
  const offset = text.indexOf("\"spaced key\"") + 1;

  assert.equal(jsonPathAtOffset(text, offset), "['a-b']['spaced key']");
});

test("returns null when the offset is not on an object key", () => {
  const text = `{
  "a": {
    "b": 1
  }
}`;
  const offset = text.indexOf("1");

  assert.equal(jsonPathAtOffset(text, offset), null);
});

test("supports JSONC trailing commas", () => {
  const text = `{
  "a": {
    "b": 1,
  },
}`;
  const offset = text.indexOf("\"b\"") + 1;

  assert.equal(jsonPathAtOffset(text, offset), "a.b");
});

test("escapes single quotes in bracket notation", () => {
  const text = `{
  "a'b": 1
}`;
  const offset = text.indexOf("\"a'b\"") + 1;

  assert.equal(jsonPathAtOffset(text, offset), "['a\\'b']");
});
