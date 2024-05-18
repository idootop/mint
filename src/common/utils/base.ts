import { Fragment } from 'react';

import { isEmpty } from './is';

export function timestamp() {
  return new Date().getTime();
}

export const nextTick = async (frames = 1) => {
  const _nextTick = async (idx: number) => {
    return new Promise(resolve => {
      requestAnimationFrame(() => resolve(idx));
    });
  };
  for (let i = 0; i < frames; i++) {
    await _nextTick(i);
  }
};

export async function sleep(time: number) {
  return new Promise<void>(resolve => setTimeout(resolve, time));
}

export function printf(...v: any[]) {
  console.log(...v);
}

export function printJson(obj: any) {
  console.log(JSON.stringify(obj, undefined, 4));
}

export function firstOf<T = any>(datas?: T[]) {
  return datas ? (datas.length < 1 ? undefined : datas[0]) : undefined;
}

export function lastOf<T = any>(datas?: T[]) {
  return datas
    ? datas.length < 1
      ? undefined
      : datas[datas.length - 1]
    : undefined;
}

/**
 * [min, max] -> int
 */
export function randomInt(min: number, max?: number) {
  if (!max) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * [min, max] -> float
 */
export function randomFloat(min: number, max?: number) {
  if (!max) {
    max = min;
    min = 0;
  }
  return randomInt(min * 1000, max * 1000) / 1000;
}

export function pickOne<T = any>(datas: T[]) {
  return datas.length < 1 ? undefined : datas[randomInt(datas.length - 1)];
}

export function range(start: number, end?: number) {
  if (!end) {
    end = start;
    start = 0;
  }
  return Array.from({ length: end - start }, (_, index) => start + index);
}

export function clamp(num: number, min: number, max: number): number {
  return num < max ? (num > min ? num : min) : max;
}

export function toInt(str: string) {
  return parseInt(str, 10);
}

export function toDouble(str: string) {
  return parseFloat(str);
}

export function toFixed(n: number, fractionDigits = 2) {
  let s = n.toFixed(fractionDigits);
  while (s[s.length - 1] === '0') {
    s = s.substring(0, s.length - 1);
  }
  if (s[s.length - 1] === '.') {
    s = s.substring(0, s.length - 1);
  }
  return s;
}

export function toSet<T = any>(datas: T[], byKey?: (e: T) => any) {
  if (byKey) {
    const keys = {};
    const newDatas: T[] = [];
    datas.forEach(e => {
      const key = jsonEncode({ key: byKey(e) }) as any;
      if (!keys[key]) {
        newDatas.push(e);
        keys[key] = true;
      }
    });
    return newDatas;
  }
  return Array.from(new Set(datas));
}

export function jsonEncode(obj: any, options?: { prettier?: boolean }) {
  const { prettier } = options ?? {};
  try {
    return prettier ? JSON.stringify(obj, undefined, 4) : JSON.stringify(obj);
  } catch (error) {
    return undefined;
  }
}

export function jsonDecode(json: string | undefined) {
  if (json == undefined) return undefined;
  try {
    return JSON.parse(json!);
  } catch (error) {
    return undefined;
  }
}

export function withDefault<T = any>(e: any, defaultValue: T): T {
  return isEmpty(e) ? defaultValue : e;
}

export function removeEmpty<T = any>(data: T): T {
  if (Array.isArray(data)) {
    return data.filter(e => e != undefined) as any;
  }
  const res = {} as any;
  for (const key in data) {
    if (data[key] != undefined) {
      res[key] = data[key];
    }
  }
  return res;
}

export const flattenChildren = (children: any) => {
  return Array.isArray(children)
    ? [].concat(
        ...children.map(c =>
          c?.type === Fragment
            ? flattenChildren(c.props.children)
            : flattenChildren(c),
        ),
      )
    : [children];
};

export const formatDate = (date: Date, fmt = 'yyyy-MM-dd hh:mm:ss'): string => {
  let result = fmt;

  const o: any = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    'q+': Math.floor((date.getMonth() + 3) / 3),
    S: date.getMilliseconds(),
  };
  if (/(y+)/.test(fmt)) {
    const a = (/(y+)/.exec(fmt) || [])[1] || '';
    result = fmt.replace(a, String(date.getFullYear()).slice(4 - a.length));
  }

  for (const k in o) {
    if (new RegExp(`(${k})`).test(fmt)) {
      const a = (new RegExp(`(${k})`).exec(fmt) || [])[1] || '';
      result = result.replace(
        a,
        a.length === 1 ? o[k] : `00${o[k]}`.slice(String(o[k]).length),
      );
    }
  }

  return result;
};

export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    const copy: any[] = [];
    obj.forEach((item, index) => {
      copy[index] = deepClone(item);
    });

    return copy as unknown as T;
  }

  const copy = {} as T;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      (copy as any)[key] = deepClone((obj as any)[key]);
    }
  }

  return copy;
};

export const withRetry = async <T = any>(
  fn: () => T,
  options?: {
    retry?: number;
    isOK?: (res: T) => boolean;
    defaultValue?: any;
  },
) => {
  const {
    retry = 3,
    isOK = e => e != null,
    defaultValue = undefined,
  } = options ?? {};
  for (let i = 0; i < retry; i++) {
    try {
      const res = await fn();
      if (isOK(res)) {
        return res;
      }
    } catch {
      //
    }
  }
  return defaultValue;
};
