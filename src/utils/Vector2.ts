function clamp(value: number, min: number, max: number): number {
  return Math.max(Math.min(value, max), min);
}

function degToRad(deg: number): number {
  return (deg / 180) * Math.PI;
}

function radToDeg(rad: number): number {
  return (rad / Math.PI) * 180;
}

export type Matrix2 =
  | [[m00: number, m01: number], [m10: number, m11: number]]
  | [m00: number, m01: number, m10: number, m11: number];

type DEGREES = "DEGREES" | "degrees";
type RADIANS = "RADIANS" | "radians";
export enum AngleMode {
  DEGREES = "DEGREES",
  RADIANS = "RADIANS",
}

export class Vector2 {
  private static ANGLE_MODE = AngleMode.RADIANS;
  private static rng = Math.random;

  public static setAngleMode(angleMode: AngleMode | DEGREES | RADIANS): void {
    Vector2.ANGLE_MODE = angleMode.toUpperCase() as AngleMode;
  }
  public static setRNG(rng: () => number) {
    Vector2.rng = rng;
  }

  public static readonly ZERO_VECTOR = new Vector2();
  public static readonly NORTH = new Vector2(0, 1);
  public static readonly NORTHEAST = new Vector2(1, 1);
  public static readonly EAST = new Vector2(1, 0);
  public static readonly SOUTHEAST = new Vector2(1, -1);
  public static readonly SOUTH = new Vector2(0, -1);
  public static readonly SOUTHWEST = new Vector2(-1, -1);
  public static readonly WEST = new Vector2(-1, 0);
  public static readonly NORTHWEST = new Vector2(-1, 1);
  public static readonly TOP = Vector2.NORTH.copy();
  public static readonly TOP_RIGHT = Vector2.NORTHEAST.copy();
  public static readonly RIGHT = Vector2.EAST.copy();
  public static readonly BOTTOM_RIGHT = Vector2.SOUTHEAST.copy();
  public static readonly BOTTOM = Vector2.SOUTH.copy();
  public static readonly BOTTOM_LEFT = Vector2.SOUTHWEST.copy();
  public static readonly LEFT = Vector2.WEST.copy();
  public static readonly TOP_LEFT = Vector2.NORTHWEST.copy();

  public x!: number;
  public y!: number;
  public [0]: this["x"];
  public [1]: this["y"];

  constructor();
  constructor(vec2: Vector2);
  constructor(x: number, y: number);
  constructor(x?: number | Vector2, y?: number) {
    if (x instanceof Vector2) return x.copy();
    if (typeof x === "undefined") return new Vector2(0, 0);
    this.x = x as number;
    this.y = y as number;

    Object.defineProperty(this, "0", {
      get: () => this.x,
      set: (val) => (this.x = val),
    });
    Object.defineProperty(this, "1", {
      get: () => this.y,
      set: (val) => (this.y = val),
    });
  }

  public static fromArray(xy: [number, number]): Vector2 {
    return new Vector2(...xy);
  }
  public static fromObject(v: { x: number; y: number }): Vector2 {
    return new Vector2(v.x, v.y);
  }
  public static fromAngle(angle: number): Vector2 {
    Vector2.ANGLE_MODE === AngleMode.DEGREES && (angle = degToRad(angle));
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }
  public static random(rng = Vector2.rng): Vector2 {
    return new Vector2(rng(), rng());
  }
  public static randomAngle(rng = Vector2.rng): Vector2 {
    const angle =
      rng() * (Vector2.ANGLE_MODE === AngleMode.RADIANS ? Math.PI * 2 : 360);
    return Vector2.fromAngle(angle);
  }

  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public add(vec2: Vector2): this;
  public add(x: number, y: number): this;
  public add(x: number | Vector2, y?: number): this {
    const v = x instanceof Vector2 ? x : { x, y };
    this.x += v.x;
    this.y += v.y!;
    return this;
  }

  public subtract(vec2: Vector2): this;
  public subtract(x: number, y: number): this;
  public subtract(x: number | Vector2, y?: number): this {
    const v = x instanceof Vector2 ? x : { x, y };
    this.x -= v.x;
    this.y -= v.y!;
    return this;
  }

  public to(vec2: Vector2): Vector2;
  public to(x: number, y: number): Vector2;
  public to(x: number | Vector2, y?: number): Vector2 {
    const v = new Vector2(x as number, y as number);
    return v.subtract(this);
  }

  public dot(vec2: Vector2): number;
  public dot(x: number, y: number): number;
  public dot(x: number | Vector2, y?: number): number {
    if (x instanceof Vector2) return this.x * x.x + this.y * x.y;
    return this.x * x + this.y * y!;
  }

  public multiplyScalar(x: number): this {
    this.x *= x;
    this.y *= x;
    return this;
  }

  public applyMatrix(m: Matrix2): this {
    const [m00, m01, m10, m11] = m.flat();
    const x = this.x * m00 + this.y * m01;
    const y = this.x * m10 + this.y * m11;
    return this.set(x, y);
  }

  public divideScalar(x: number): this {
    return this.multiplyScalar(1 / x);
  }

  public negate(): this {
    this.x = -this.x;
    this.y = -this.y;
    return this;
  }

  public cross(vec2: Vector2): number;
  public cross(x: number, y: number): number;
  public cross(x: number | Vector2, y?: number): number {
    if (x instanceof Vector2) return this.x * x.y - this.y * x.x;
    return this.x * y! - this.y * x;
  }

  public lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  public length(): number {
    return Math.hypot(this.x, this.y);
  }

  public normalize(): this {
    return this.divideScalar(this.length() || 1);
  }

  public angle(): number {
    const angle = Math.atan2(-this.y, -this.x) + Math.PI;
    return Vector2.ANGLE_MODE === AngleMode.RADIANS ? angle : radToDeg(angle);
  }
  public angleBetween(vec2: Vector2): number;
  public angleBetween(x: number, y: number): number;
  public angleBetween(x: number | Vector2, y?: number): number {
    const v = new Vector2(x as number, y as number);
    return Math.acos(clamp(this.dot(v) / (this.length() * v.length()), -1, 1));
  }

  public distanceToSquared(vec2: Vector2): number;
  public distanceToSquared(x: number, y: number): number;
  public distanceToSquared(x: number | Vector2, y?: number): number {
    const v = x instanceof Vector2 ? x : { x, y };
    const dx = this.x - v.x;
    const dy = this.y - v.y!;
    return dx * dx + dy * dy;
  }

  public distanceTo(vec2: Vector2): number;
  public distanceTo(x: number, y: number): number;
  public distanceTo(x: number | Vector2, y?: number): number {
    const v = x instanceof Vector2 ? x : { x, y };
    const dx = this.x - v.x;
    const dy = this.y - v.y!;
    return Math.hypot(dx, dy);
  }

  public setLength(length: number): this {
    return this.normalize().multiplyScalar(length);
  }
  public setMagnitude(length: number): this {
    return this.setLength(length);
  }

  public rotatedAround(center: Vector2, angle: number): Vector2;
  public rotatedAround(cx: number, cy: number, angle: number): Vector2;
  public rotatedAround(
    ...args: [Vector2, number] | [number, number, number]
  ): Vector2 {
    let angle: number;
    let center = new Vector2();

    if (args[0] instanceof Vector2) [center, angle] = args;
    else [center.x, center.y, angle] = args as [number, number, number];

    if (Vector2.ANGLE_MODE === AngleMode.DEGREES) angle = degToRad(angle);

    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const x = this.x - center.x;
    const y = this.y - center.y;

    return new Vector2(x * c - y * s + center.x, x * s + y * c + center.y);
  }

  public rotate(angle: number): this {
    if (Vector2.ANGLE_MODE === AngleMode.DEGREES) angle = degToRad(angle);
    const { x, y } = this;
    this.x = Math.cos(angle) * x - Math.sin(angle) * y;
    this.y = Math.sin(angle) * x + Math.cos(angle) * y;
    return this;
  }

  public rotateAround(center: Vector2, angle: number): this;
  public rotateAround(cx: number, cy: number, angle: number): this;
  public rotateAround(
    ...args: [Vector2, number] | [number, number, number]
  ): this {
    let angle: number;
    let center = new Vector2();

    if (args[0] instanceof Vector2) [center, angle] = args;
    else {
      [center.x, center.y, angle] = args as [number, number, number];
    }

    if (Vector2.ANGLE_MODE === AngleMode.DEGREES) angle = degToRad(angle);

    const c = Math.cos(angle);
    const s = Math.sin(angle);

    const x = this.x - center.x;
    const y = this.y - center.y;

    this.x = x * c - y * s + center.x;
    this.y = x * s + y * c + center.y;

    return this;
  }

  public scale(ratio: number): this;
  public scale(vec2: Vector2): this;
  public scale(ratioX: number, ratioY: number): this;
  public scale(ratioX: number | Vector2, ratioY?: number): this {
    if (ratioX instanceof Vector2) {
      this.x *= ratioX.x;
      this.y *= ratioX.y;
      return this;
    }
    if (ratioY !== undefined) {
      this.x *= ratioX;
      this.y *= ratioY;
      return this;
    }
    return this.multiplyScalar(ratioX);
  }

  public scaleFrom(center: Vector2, ratio: number): this;
  public scaleFrom(x: number, y: number, ratio: number): this;
  public scaleFrom(
    ...args: [Vector2, number] | [number, number, number]
  ): this {
    let ratio: number;
    let center = new Vector2();

    if (args[0] instanceof Vector2) [center, ratio] = args;
    else {
      [center.x, center.y, ratio] = args as [number, number, number];
    }

    return this.subtract(center).multiplyScalar(ratio).add(center);
  }

  public equals(vec2?: Vector2): boolean;
  public equals(x: number, y: number): boolean;
  public equals(x?: number | Vector2, y?: number): boolean {
    if (typeof x === "undefined") return false;
    if (x instanceof Vector2) return x.x === this.x && x.y === this.y;
    return this.x === x && this.y === y;
  }

  public copy(): Vector2 {
    return new Vector2(this.x, this.y);
  }
  public toArray(): [number, number] {
    return [this.x, this.y];
  }
  // wtf typescript
  public *[Symbol.iterator](): Generator<number, void, unknown> {
    yield this.x;
    yield this.y;
  }
  public toString(): string {
    return `Vector2(${this.x.toFixed(2)}, ${this.y.toFixed(2)})`;
  }
}

export default Vector2;
