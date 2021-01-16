export class Vector {
  constructor(public x: number, public y: number) {}
  multScalar(s: number): Vector {
    return new Vector(this.x * s, this.y * s);
  }
  rotated90(): Vector {
    return new Vector(this.y, -this.x);
  }
  addVector(another: Vector): Vector {
    return new Vector(this.x + another.x, this.y + another.y);
  }
}

enum Modes {
  FILL = "f",
  ALL = "a",
}

enum States {
  NO_DIR = "n",
  FRONT = "f",
  LEFT = "l",
  RIGHT = "r",
  BACK = "b",
}

export const Directions = {
  t: new Vector(0, -1),
  r: new Vector(1, 0),
  b: new Vector(0, 1),
  l: new Vector(-1, 0),
};

// [(init number)|mode] [tiles|(tile mode)+/-offset[&others]]+
export function parseAttackRange(
  source: string,
  {
    charDir = "r",
    evenOffset = -1,
  }: { charDir: keyof typeof Directions; evenOffset?: number }
): Array<Vector> {
  let result = [];

  let charDirection = Directions[charDir];
  const sourceArr = source.split(" ").filter((i) => i);
  let [, initRow = 0, state = States.FRONT] = sourceArr[0].match(
    /([+-]?\d+)?([a-zA-Z])?/
  ) as [unknown, string?, States?];
  state = state?.toLowerCase() as States;
  if (sourceArr.length === 1) {
    state = States.FRONT;
    initRow = 0;
  } else if (state !== States.FRONT) {
    switch (state) {
      case States.RIGHT:
        charDirection = charDirection.rotated90();
      case States.BACK:
        charDirection = charDirection.rotated90();
      case States.LEFT:
        charDirection = charDirection.rotated90();
    }
  }
  const charNormal = charDirection.rotated90();
  initRow = parseInt(initRow as string);

  if (sourceArr.length > 1) sourceArr.splice(0, 1);

  for (let i = 0; i < sourceArr.length; ++i) {
    const match = sourceArr[i].match(/(.+?)\*(\d+)/);
    if (!match) continue;
    const [, exp, rep] = match as [unknown, string, string];
    if (rep) sourceArr.splice(i, 1, ...Array(parseInt(rep)).fill(exp));
  }

  for (const [i, exps] of sourceArr.entries()) {
    const idx = i + initRow;
    for (const exp of exps.split("&")) {
      let [, row, shift = 0] = exp.match(/([a-zA-Z0-9]+)([+-][0-9]+)?/) as [
        unknown,
        string,
        string?
      ];
      shift = -parseInt(shift as string);
      let rowCount: number;
      if (Object.values(Modes).includes(row.toLowerCase() as Modes)) {
        rowCount = getRow(idx, row.toLowerCase() as Modes);
      } else rowCount = parseInt(row);
      if (rowCount === 0) continue;
      const even = !(rowCount & 1);
      // if (even) ++rowCount;
      const start =
        -((rowCount - 1) / 2) + shift + (even as any) * 0.5 * evenOffset;
      const jRow = charDirection.multScalar(idx);

      const noDir = state === States.NO_DIR;
      for (let j = 0; j < rowCount; ++j) {
        if (noDir) {
          const vec = jRow.addVector(charNormal.multScalar(j + start));
          result.push(vec);
          let temp = vec;
          for (let w = 0; w < 3; ++w) {
            temp = temp.rotated90();
            result.push(temp);
          }
        } else result.push(jRow.addVector(charNormal.multScalar(j + start)));
      }
    }
  }
  const set = new Set();
  const ret = [];
  for (const v of result) {
    const temp = `${v.x},${v.y}`;
    if (!set.has(temp)) {
      set.add(temp);
      ret.push(v);
    }
  }

  return ret as any;
}

function getRow(x: number, mode: Modes): number {
  console.log("getrow", x, mode);

  x = Math.abs(x);
  if (x === 0) return 1;
  if (mode === Modes.FILL) x -= 1;
  return 2 * x + 1;
}

export function map(
  x: number,
  from_: [number, number],
  to: [number, number]
): number {
  const [fMin, fMax] = from_;
  const [tMin, tMax] = to;
  return ((x - fMin) * (tMax - tMin)) / (fMax - fMin) + tMin;
}

export function clip(x: number, range: [number, number]): number {
  const [min, max] = range;
  return Math.min(max, Math.max(min, x));
}

export class ValueError extends Error {
  constructor(...args: any[]) {
    super(...args);
    this.name = "ValueError";
  }
}

export function range(end: number): IterableIterator<number>;
export function range(start: number, end: number): IterableIterator<number>;
export function range(
  start: number,
  end: number,
  step: number
): IterableIterator<number>;

export function* range(
  ...args: [number, number?, number?]
): IterableIterator<number> {
  let [start, end, step = 1] = args;
  if (end === void 0) [end, start] = [start, 0];
  for (const n of [start, end, step])
    if (!Number.isInteger(n))
      throw new TypeError(`'${n}' cannot be interpreted as an integer`);
  if (step === 0) throw new ValueError("range() arg 3 must not be zero");
  let return_;
  if (step > 0) return_ = (x: number) => x >= (end as number);
  else return_ = (x: number) => x <= (end as number);
  while (true) {
    if (return_(start)) return;
    yield start;
    start += step;
  }
}

export default { Vector, parseAttackRange, map, clip };
