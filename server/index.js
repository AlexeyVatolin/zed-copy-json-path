#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { jsonPathAtOffset, offsetFromPosition } from "./jsonPath.js";

const documents = new Map();
let buffer = Buffer.alloc(0);

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  readMessages();
});

function readMessages() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      return;
    }

    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const contentLength = /Content-Length: (\d+)/i.exec(header)?.[1];
    if (!contentLength) {
      buffer = buffer.subarray(headerEnd + 4);
      continue;
    }

    const length = Number(contentLength);
    const messageStart = headerEnd + 4;
    const messageEnd = messageStart + length;
    if (buffer.length < messageEnd) {
      return;
    }

    const message = JSON.parse(
      buffer.subarray(messageStart, messageEnd).toString("utf8"),
    );
    buffer = buffer.subarray(messageEnd);
    handleMessage(message);
  }
}

function handleMessage(message) {
  switch (message.method) {
    case "initialize":
      respond(message.id, {
        capabilities: {
          textDocumentSync: 1,
          codeActionProvider: {
            codeActionKinds: ["quickfix"],
          },
          executeCommandProvider: {
            commands: ["copyJsonPath.copy"],
          },
        },
      });
      break;
    case "initialized":
      break;
    case "textDocument/didOpen":
      documents.set(
        message.params.textDocument.uri,
        message.params.textDocument.text,
      );
      break;
    case "textDocument/didChange":
      documents.set(
        message.params.textDocument.uri,
        message.params.contentChanges.at(-1)?.text ?? "",
      );
      break;
    case "textDocument/didClose":
      documents.delete(message.params.textDocument.uri);
      break;
    case "textDocument/codeAction":
      respond(message.id, codeActions(message.params));
      break;
    case "workspace/executeCommand":
      executeCommand(message);
      break;
    case "shutdown":
      respond(message.id, null);
      break;
    case "exit":
      process.exit(0);
      break;
    default:
      if (message.id !== undefined) {
        respond(message.id, null);
      }
  }
}

function codeActions(params) {
  const uri = params.textDocument.uri;
  const text = documents.get(uri);
  if (text === undefined) {
    return [];
  }

  const offset = offsetFromPosition(text, params.range.start);
  const path = jsonPathAtOffset(text, offset);
  if (path === null) {
    return [];
  }

  return [
    {
      title: `Copy JSON Path: ${path}`,
      kind: "quickfix",
      command: {
        title: "Copy JSON Path",
        command: "copyJsonPath.copy",
        arguments: [uri, params.range.start],
      },
    },
  ];
}

function executeCommand(message) {
  const [uri, position] = message.params.arguments ?? [];
  const text = documents.get(uri);

  if (message.params.command !== "copyJsonPath.copy") {
    respondError(message.id, -32601, `unknown command: ${message.params.command}`);
    return;
  }

  if (text === undefined || position === undefined) {
    respondError(message.id, -32602, "missing document or position");
    return;
  }

  const path = jsonPathAtOffset(text, offsetFromPosition(text, position));
  if (path === null) {
    respondError(message.id, -32602, "cursor is not on a JSON object key");
    return;
  }

  const copyResult = copyToClipboard(path);
  if (!copyResult.ok) {
    respondError(message.id, -32000, copyResult.error);
    return;
  }

  respond(message.id, path);
}

function copyToClipboard(text) {
  const commands = clipboardCommands();

  for (const command of commands) {
    const result = spawnSync(command.bin, command.args, {
      input: text,
      encoding: "utf8",
    });

    if (result.status === 0) {
      return { ok: true };
    }
  }

  return {
    ok: false,
    error:
      "No clipboard command worked. Install pbcopy, wl-copy, xclip, xsel, or clip.",
  };
}

function clipboardCommands() {
  if (process.platform === "darwin") {
    return [{ bin: "pbcopy", args: [] }];
  }

  if (process.platform === "win32") {
    return [{ bin: "clip", args: [] }];
  }

  return [
    { bin: "wl-copy", args: [] },
    { bin: "xclip", args: ["-selection", "clipboard"] },
    { bin: "xsel", args: ["--clipboard", "--input"] },
  ];
}

function respond(id, result) {
  write({ jsonrpc: "2.0", id, result });
}

function respondError(id, code, message) {
  write({ jsonrpc: "2.0", id, error: { code, message } });
}

function write(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);
}
