import { Vector2 } from "./Vector2";

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
  if (typeof end === "undefined") [end, start] = [start, 0];
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

export default { map, clip };
