# Copy JSON Path

This is a Zed extension scaffold for copying the JsonPath of the JSON object key at the cursor.

Example:

```json
{
  "a": {
    "b": 1
  }
}
```

Running the action on key `"b"` copies:

```text
a.b
```

## Zed API limitation

As of May 26, 2026, Zed extensions do not expose an API for adding arbitrary editor right-click context menu items, directly reading the current editor cursor/buffer from an extension command, or writing to the clipboard from the extension API itself.

This scaffold uses the closest available integration point: a JSON language server that returns a `Copy JSON Path` code action and handles that action by writing to the system clipboard. The action is available through Zed's code-action UI, not through right-click.

## Files

- `extension.toml` registers the extension and JSON language server.
- `src/lib.rs` starts the bundled Node language server through Zed's extension API.
- `server/index.js` implements a tiny dependency-free LSP server.
- `server/jsonPath.js` contains the tested JsonPath resolver backed by `jsonc-parser`.
- `test/jsonPath.test.js` covers the path formatting behavior.

## Local verification

```sh
npm test
```

## Install as a dev extension

1. Open Zed's command palette.
2. Run `zed: install dev extension`.
3. Select this `copy-json-path` folder.
4. Open a JSON file.
5. Put the cursor on a JSON object key, for example inside `"b"`.
6. Run `editor: toggle code actions` from the command palette.
7. Select `Copy JSON Path: ...`.

The action copies dotted JsonPath where possible, and bracket notation for property names that cannot be safely represented with dot notation, for example `['a-b']['spaced key']`.
