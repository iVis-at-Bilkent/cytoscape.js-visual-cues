export type NodeCuePosition =
  | "top"
  | "center"
  | "bottom"
  | "right"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-right"
  | "bottom-left";

export type EdgeCuePosition = "target" | "source" | "center";

export type Events2show =
  | "mouseover"
  | "mouseout"
  | "style"
  | "select"
  | "unselect"
  | "position";

export interface CueOptions {
  id: number | string;
  show: "select" | "hover" | "always" | "never";
  position: NodeCuePosition | EdgeCuePosition;
  marginX: string | number;
  marginY: string | number;
  onCueClicked: ((ele: any) => void) | undefined;
  htmlElem: HTMLElement;
  imgData: { width: number; height: number; src: string } | null;
  zoom2hide: number;
  isFixedSize: boolean;
  zIndex: number;
  tooltip: string;
}

export interface Cues {
  [key: string]: CueOptions;
}

export interface CueData {
  cues: Cues;
  graphElem: any;
  positionFn: Function;
  styleFn: Function;
}

export interface Str2CueData {
  [key: string]: CueData;
}

export interface Point {
  x: number;
  y: number;
}

/** https://davidwalsh.name/javascript-debounce-function
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 * @param  {} func
 * @param  {number} wait
 * @param  {boolean=false} immediate
 * @param  {} preConditionFn=null if function returns false, ignore this call
 */
export function debounce(func, wait: number, immediate: boolean = false) {
  let timeout;
  return function () {
    const context = this,
      args = arguments;
    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/** calls `fn2` at the 'beginning' of frequent calls to `fn1`
 * @param  {Function} fn1
 * @param  {number} wait
 * @param  {Function} fn2
 */
export function debounce2(fn1: Function, wait: number, fn2: Function) {
  let timeout;
  let isInit = true;
  return function () {
    const context = this,
      args = arguments;
    const later = function () {
      timeout = null;
      fn1.apply(context, args);
      isInit = true;
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (isInit) {
      fn2.apply(context, args);
      isInit = false;
    }
  };
}

export function isNullish(o) {
  return o === undefined || o === null;
}

export function isNumber(value: string | number): boolean {
  return value != null && !isNaN(Number(value.toString()));
}

// https://en.wikipedia.org/wiki/B%C3%A9zier_curve#Quadratic_B%C3%A9zier_curves
export function quadraticBezierCurve(
  p0: Point,
  p1: Point,
  p2: Point,
  t: number
): Point {
  const r = 1 - t;
  const part1 = scalarMult(vectorAdd(scalarMult(p0, r), scalarMult(p1, t)), r);
  const part2 = scalarMult(vectorAdd(scalarMult(p1, r), scalarMult(p2, t)), t);
  return vectorAdd(part1, part2);
}

export function midPoint(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

function scalarMult(p: Point, s: number): Point {
  return { x: p.x * s, y: p.y * s };
}

function vectorAdd(p1: Point, p2: Point): Point {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

/**
 * Finds the intersection point between the rectangle with parallel sides to the x and y
 * axes the half-line pointing towards (x,y) originating from the middle of the rectangle
 * Note: the function works given min[XY] <= max[XY],
 *       even though minY may not be the "top" of the rectangle
 *       because the coordinate system is flipped.
 * Note: if the input is inside the rectangle,
 *       the line segment wouldn't have an intersection with the rectangle,
 *       but the projected half-line does.
 * Warning: passing in the middle of the rectangle will return the midpoint itself
 *          there are infinitely many half-lines projected in all directions,
 *          so let's just shortcut to midpoint (GIGO).
 *
 * @param p :x,y coordinates of the point to build the half-line from
 * @param b :bounding box representing rectangle
 * @return an object with x and y members for the intersection
 * @throws if validate == true and (x,y) is inside the rectangle
 * @author TWiStErRob
 * @licence Dual CC0/WTFPL/Unlicence, whatever floats your boat
 * @see <a href="http://stackoverflow.com/a/31254199/253468">source</a>
 * @see <a href="http://stackoverflow.com/a/18292964/253468">based on</a>
 */
export function pointOnRect(p, b): Point {
  const { x, y } = p;
  const minX = Math.min(b.x1, b.x2);
  const minY = Math.min(b.y1, b.y2);
  const maxX = Math.max(b.x1, b.x2);
  const maxY = Math.max(b.y1, b.y2);

  let midX = (minX + maxX) / 2;
  let midY = (minY + maxY) / 2;
  // if (midX - x == 0) -> m == ±Inf -> minYx/maxYx == x (because value / ±Inf = ±0)
  let m = (midY - y) / (midX - x);

  if (x <= midX) {
    // check "left" side
    let minXy = m * (minX - x) + y;
    if (minY <= minXy && minXy <= maxY) return { x: minX, y: minXy };
  }

  if (x >= midX) {
    // check "right" side
    let maxXy = m * (maxX - x) + y;
    if (minY <= maxXy && maxXy <= maxY) return { x: maxX, y: maxXy };
  }

  if (y <= midY) {
    // check "top" side
    let minYx = (minY - y) / m + x;
    if (minX <= minYx && minYx <= maxX) return { x: minYx, y: minY };
  }

  if (y >= midY) {
    // check "bottom" side
    let maxYx = (maxY - y) / m + x;
    if (minX <= maxYx && maxYx <= maxX) return { x: maxYx, y: maxY };
  }

  // edge case when finding midpoint intersection: m = 0/0 = NaN
  if (x === midX && y === midY) return { x: x, y: y };

  // Should never happen :) If it does, please tell me!
  throw (
    "Cannot find intersection for " +
    [x, y] +
    " inside rectangle " +
    [minX, minY] +
    " - " +
    [maxX, maxY] +
    "."
  );
}
