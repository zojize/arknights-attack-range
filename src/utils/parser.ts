import grammar from "./grammar.pegjs";
import Vector2 from "./Vector2";
import { range } from ".";

function fixVec(vec: Vector2): Vector2 {
  vec.x = Math.round(vec.x);
  vec.y = Math.round(vec.y);
  return vec;
}

function getOffsets(n: number, evenOffset: number) {
  const off = Math.floor(n / 2) + +!(n & 1) * evenOffset;
  return Array.from(range(n)).map((x) => x - off);
}

interface ParseResult {
  init: {
    modes: string;
    offset: number;
  };
  commands: {
    cmd: Command | number;
    offset: number;
  }[][];
}

enum Mode {
  ALL = "a",
  FRONT = "f",
  LEFT = "l",
  RIGHT = "r",
  BACK = "b",
}

enum Command {
  FILL = "f",
  COVER = "c",
}

const directions = {
  r: Vector2.RIGHT.copy(),
  l: Vector2.LEFT.copy(),
  t: Vector2.TOP.copy(),
  b: Vector2.BOTTOM.copy(),
} as const;

interface LoadResult {
  message: string;
  points?: Vector2[];
}

export function load(
  text: string,
  {
    charDir,
    evenOffset,
  }: {
    charDir: keyof typeof directions;
    evenOffset: number;
  } = {
    charDir: "r",
    evenOffset: -1,
  }
): LoadResult {
  const charVec = directions[charDir];
  let parsed: ParseResult;
  try {
    parsed = grammar.parse(text);
  } catch (e: unknown) {
    // console.warn(e);
    return {
      message: (e as { message: string }).message,
    };
  }

  const { init, commands } = parsed;

  const baseVecs: Vector2[] = [];
  let dir = 1;
  if (init.modes === "a") init.modes = "flrb";
  if (init.modes.includes("f")) {
    baseVecs.push(charVec.copy());
  }
  if (init.modes.includes("l")) {
    baseVecs.push(fixVec(charVec.copy().rotate(-Math.PI / 2)));
  }
  if (init.modes.includes("r")) {
    baseVecs.push(fixVec(charVec.copy().rotate(Math.PI / 2)));
  }
  if (init.modes.includes("b")) {
    baseVecs.push(fixVec(charVec.copy().rotate(Math.PI)));
  }
  if (init.modes.includes("-")) {
    dir = -1;
  }

  const baseOffset = init.offset;

  let row = baseOffset;
  const points: Vector2[] = [];
  const rMap = new WeakMap<Vector2, Vector2>();
  const existing = new Set();
  for (const v of baseVecs) rMap.set(v, fixVec(v.copy().rotate(Math.PI / 2)));
  for (const cmds of commands) {
    for (const { cmd, offset } of cmds) {
      const n = typeof cmd === "string" ? getRow(row, cmd) : cmd;
      const offsets = getOffsets(n, evenOffset).map((x) => x + offset);
      for (const o of offsets)
        for (const v of baseVecs) {
          const pt = v
            .copy()
            .multiplyScalar(row)
            .add(rMap.get(v)!.copy().multiplyScalar(-o));
          const s = pt.toString();
          if (!existing.has(s)) points.push(pt);
          existing.add(s);
        }
    }
    row += dir;
  }

  return { message: "ok", points };
}

function getRow(x: number, mode: Command): number {
  x = Math.abs(x);
  if (x === 0) return 1;
  if (mode === Command.COVER) x -= 1;
  return 2 * x + 1;
}
