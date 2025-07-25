// biome-ignore lint/suspicious/noShadowRestrictedNames: just do it
export function isNaN(e: unknown): boolean {
  return Number.isNaN(e);
}

export function isNull(e: unknown): boolean {
  return e === null;
}

export function isUndefined(e: unknown): boolean {
  return e === undefined;
}

export function isNullish(e: unknown): boolean {
  return e === null || e === undefined;
}

export function isNotNullish(e: unknown): boolean {
  return !isNullish(e);
}

export function isEmpty(e: any): boolean {
  if ((e?.size ?? 0) > 0) {
    return false;
  }

  return (
    isNaN(e) ||
    isNullish(e) ||
    (isString(e) && (e.length < 1 || !/\S/.test(e))) ||
    (isArray(e) && e.length < 1) ||
    (isObject(e) && Object.keys(e).length < 1)
  );
}

export function isNotEmpty(e: unknown): boolean {
  return !isEmpty(e);
}

export function isNumber(e: unknown): e is number {
  return typeof e === 'number' && !isNaN(e);
}

export function isString(e: unknown): e is string {
  return typeof e === 'string';
}

export function isStringNumber(e: any): boolean {
  return isString(e) && isNotEmpty(e) && !isNaN(Number(e));
}

export function isIntString(e: any): boolean {
  if (!isString(e)) return false;
  const number = Number(e);

  return !isNaN(number) && Number.isInteger(number);
}

export function isArray(e: any): e is any[] {
  return Array.isArray(e);
}

export function isBlob(e: unknown): boolean {
  return e instanceof Blob;
}

export function isObject(e: unknown): boolean {
  return typeof e === 'object' && isNotNullish(e) && !isArray(e);
}

export function isFunction(e: unknown): boolean {
  return typeof e === 'function';
}

export function isClass(e: any): boolean {
  return isFunction(e) && e.toString().startsWith('class ');
}

export function isServer() {
  return typeof window === 'undefined';
}

export function isBrowser() {
  return typeof window !== 'undefined';
}

export const kIsDev = process.env.NODE_ENV === 'development';
