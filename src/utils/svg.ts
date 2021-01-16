const _ = require('lodash');

const SVGNS = 'http://www.w3.org/2000/svg';

export enum SVGPosition {
  CENTER = 'CENTER',
  CORNER = 'CORNER',
}

export interface RectOptions {
  width: number | string;
  height: number | string;
  position?: SVGPosition;
  [p: string]: string | number | undefined;
}

export function rect(svg: SVGElement, options: RectOptions): SVGRectElement {
  const { position } = options;
  Reflect.deleteProperty(options, 'position');

  const el = document.createElementNS(SVGNS, 'rect');
  for (const [attr, val] of Object.entries(options))
    el.setAttributeNS(null, _.kebabCase(attr), val as string);

  svg.appendChild(el);

  if (position === SVGPosition.CENTER) {
    const { width, height } = el.getBBox();
    el.setAttributeNS(
      null,
      'transform',
      `translate(${-width / 2} ${-height / 2})`,
    );
  }

  return el;
}

export default {
  SVGPosition,
  rect,
};
