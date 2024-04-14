import { jsonDecode, jsonEncode } from './base';

class Storage {
  _caches = {};

  get<T = any>(key: string): T | undefined {
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (this._caches[key]) {
      return this._caches[key];
    }
    const str = localStorage.getItem(key);
    this._caches[key] = jsonDecode(str ?? '{}')?.data;

    return this._caches[key];
  }

  set = (key: string, data: any) => {
    if (typeof localStorage === 'undefined') {
      return;
    }
    if (data) {
      const saveData = jsonEncode({ data })!;
      localStorage.setItem(key, saveData);
    } else {
      localStorage.removeItem(key);
    }
    this._caches[key] = data;
  };
}

export const storage = new Storage();
