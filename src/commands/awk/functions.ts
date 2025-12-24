import type { AwkContext } from "./types.js";

// String functions for awk
export function awkLength(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): number {
  if (args.length === 0) {
    return ctx.line.length;
  }
  const str = String(evaluateExpr(args[0], ctx));
  return str.length;
}

export function awkSubstr(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): string {
  if (args.length < 2) return "";
  const str = String(evaluateExpr(args[0], ctx));
  const start = Number(evaluateExpr(args[1], ctx)) - 1; // awk is 1-indexed
  if (args.length >= 3) {
    const len = Number(evaluateExpr(args[2], ctx));
    return str.substr(Math.max(0, start), len);
  }
  return str.substr(Math.max(0, start));
}

export function awkIndex(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): number {
  if (args.length < 2) return 0;
  const str = String(evaluateExpr(args[0], ctx));
  const target = String(evaluateExpr(args[1], ctx));
  const idx = str.indexOf(target);
  return idx === -1 ? 0 : idx + 1; // awk is 1-indexed
}

export function awkSplit(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): number {
  if (args.length < 2) return 0;
  const str = String(evaluateExpr(args[0], ctx));
  const arrayName = args[1].trim();
  const sep = args.length >= 3 ? String(evaluateExpr(args[2], ctx)) : ctx.FS;

  const parts = str.split(sep === " " ? /\s+/ : sep);

  // Initialize array if needed
  if (!ctx.arrays[arrayName]) {
    ctx.arrays[arrayName] = {};
  }

  // Clear array and populate with split results (1-indexed)
  ctx.arrays[arrayName] = {};
  for (let i = 0; i < parts.length; i++) {
    ctx.arrays[arrayName][String(i + 1)] = parts[i];
  }

  return parts.length;
}

export function awkSub(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): number {
  if (args.length < 2) return 0;
  const pattern = String(evaluateExpr(args[0], ctx));
  const replacement = String(evaluateExpr(args[1], ctx));
  const targetVar = args.length >= 3 ? args[2].trim() : "$0";

  let target: string;
  if (targetVar === "$0") {
    target = ctx.line;
  } else if (targetVar.startsWith("$")) {
    const idx = parseInt(targetVar.slice(1), 10) - 1;
    target = ctx.fields[idx] || "";
  } else {
    target = String(ctx.vars[targetVar] ?? "");
  }

  const regex = new RegExp(pattern);
  const newTarget = target.replace(regex, replacement);
  const changed = newTarget !== target ? 1 : 0;

  // Update the target
  if (targetVar === "$0") {
    ctx.line = newTarget;
  } else if (targetVar.startsWith("$")) {
    const idx = parseInt(targetVar.slice(1), 10) - 1;
    ctx.fields[idx] = newTarget;
  } else {
    ctx.vars[targetVar] = newTarget;
  }

  return changed;
}

export function awkGsub(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): number {
  if (args.length < 2) return 0;
  const pattern = String(evaluateExpr(args[0], ctx));
  const replacement = String(evaluateExpr(args[1], ctx));
  const targetVar = args.length >= 3 ? args[2].trim() : "$0";

  let target: string;
  if (targetVar === "$0") {
    target = ctx.line;
  } else if (targetVar.startsWith("$")) {
    const idx = parseInt(targetVar.slice(1), 10) - 1;
    target = ctx.fields[idx] || "";
  } else {
    target = String(ctx.vars[targetVar] ?? "");
  }

  const regex = new RegExp(pattern, "g");
  const matches = target.match(regex);
  const count = matches ? matches.length : 0;
  const newTarget = target.replace(regex, replacement);

  // Update the target
  if (targetVar === "$0") {
    ctx.line = newTarget;
  } else if (targetVar.startsWith("$")) {
    const idx = parseInt(targetVar.slice(1), 10) - 1;
    ctx.fields[idx] = newTarget;
  } else {
    ctx.vars[targetVar] = newTarget;
  }

  return count;
}

export function awkTolower(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): string {
  if (args.length === 0) return "";
  const str = String(evaluateExpr(args[0], ctx));
  return str.toLowerCase();
}

export function awkToupper(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): string {
  if (args.length === 0) return "";
  const str = String(evaluateExpr(args[0], ctx));
  return str.toUpperCase();
}

export function awkSprintf(
  args: string[],
  ctx: AwkContext,
  evaluateExpr: (expr: string, ctx: AwkContext) => string | number,
): string {
  if (args.length === 0) return "";
  const format = String(evaluateExpr(args[0], ctx));
  const values = args.slice(1);

  let valueIdx = 0;
  let result = "";
  let i = 0;

  while (i < format.length) {
    if (format[i] === "%" && i + 1 < format.length) {
      // Parse format specifier: %[flags][width][.precision]specifier
      let j = i + 1;
      // Skip flags
      while (j < format.length && /[-+ #0]/.test(format[j])) j++;
      // Skip width
      while (j < format.length && /\d/.test(format[j])) j++;
      // Skip precision
      if (format[j] === ".") {
        j++;
        while (j < format.length && /\d/.test(format[j])) j++;
      }

      const spec = format[j];
      if (spec === "s" || spec === "d" || spec === "i" || spec === "f") {
        const val = values[valueIdx] ? evaluateExpr(values[valueIdx], ctx) : "";
        result += String(val);
        valueIdx++;
        i = j + 1;
      } else if (spec === "%") {
        result += "%";
        i = j + 1;
      } else {
        result += format[i++];
      }
    } else if (format[i] === "\\" && i + 1 < format.length) {
      const esc = format[i + 1];
      if (esc === "n") result += "\n";
      else if (esc === "t") result += "\t";
      else if (esc === "r") result += "\r";
      else result += esc;
      i += 2;
    } else {
      result += format[i++];
    }
  }

  return result;
}
