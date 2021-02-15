// shims-pegjs.d.ts

declare module "*.pegjs" {
  import { Parser } from "pegjs";
  const parser: Parser;
  export default parser;
}
