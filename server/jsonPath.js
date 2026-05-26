import { getLocation } from "jsonc-parser";

export function jsonPathAtOffset(text, offset) {
  const location = getLocation(text, offset);

  if (!location.isAtPropertyKey) {
    return null;
  }

  return formatPath(location.path);
}

export function offsetFromPosition(text, position) {
  let line = 0;
  let character = 0;

  for (let index = 0; index < text.length; index += 1) {
    if (line === position.line && character === position.character) {
      return index;
    }

    if (text[index] === "\n") {
      line += 1;
      character = 0;
    } else {
      character += 1;
    }
  }

  return text.length;
}

function formatPath(segments) {
  return segments
    .map((segment, index) => {
      if (Number.isInteger(segment)) {
        return `[${segment}]`;
      }

      if (isDotSafe(segment)) {
        return index === 0 ? segment : `.${segment}`;
      }

      return `['${escapeBracketProperty(segment)}']`;
    })
    .join("");
}

function isDotSafe(value) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
}

function escapeBracketProperty(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
