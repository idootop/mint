import { Metadata } from 'next';

import { getOGMetadata } from './site-metadata';

export interface PageMetadata {
  /**
   * 页面绝对路径
   *
   * 比如： /posts/hello
   */
  path: string;
  title: string;
  description?: string;
  cover?: string;
  /**
   * 是否隐藏
   */
  isHidden?: boolean;
  /**
   * 排序
   *
   * +1 ~ +N：置顶排序（从前往后：+1，+2，+3...）
   *
   * -1 ~ -N：置底排序（从前往后：-1，-2，-3...）
   */
  index?: 'string';
  createAt?: string;
  updateAt?: string;
}

const kPages: Record<string, any> = {};
export const getPages = async <T extends PageMetadata>(
  category: string,
  ctx: any,
  options?: {
    buildMetadata?: (T) => T;
    sort?: (a: T, b: T) => number;
  },
): Promise<T[]> => {
  const { sort, buildMetadata } = options ?? {};
  if (kPages[category]) {
    return kPages[category];
  }
  // 导入
  const pages = ctx.keys().map(filePath => {
    const page = ctx(filePath);
    const path =
      `/${category}/` + filePath.substr(2).replace(/\/content\.mdx$/, '');
    return { path, ...page.metadata };
  });
  // 排序
  let topPages: T[] = [];
  let middlePages: T[] = [];
  let bottomPages: T[] = [];
  for (let page of pages) {
    if (buildMetadata) {
      // metadata 预处理
      page = buildMetadata(page);
    }
    if ((page.index ?? '').startsWith('+')) {
      topPages.push(page);
    } else if ((page.index ?? '').startsWith('-')) {
      bottomPages.push(page);
    } else {
      middlePages.push(page);
    }
  }
  if (sort) {
    middlePages = middlePages.sort(sort);
  }
  topPages = topPages.sort(
    (a, b) =>
      parseFloat(a.index!.replace('+', '')) -
      parseFloat(b.index!.replace('+', '')),
  );
  bottomPages = bottomPages.sort(
    (a, b) =>
      parseFloat(a.index!.replace('-', '')) -
      parseFloat(b.index!.replace('-', '')),
  );
  kPages[category] = [...topPages, ...middlePages, ...bottomPages];
  return kPages[category];
};

export interface PageContext<T extends PageMetadata> {
  total: number;
  index?: number;
  current?: T;
  previous?: T;
  next?: T;
}

export const getPageContext = async <T extends PageMetadata>(
  pages: T[],
  path: string,
): Promise<PageContext<T>> => {
  const pageIdx = pages
    .filter(e => !e.isHidden)
    .findIndex(e => e.path === path);
  return {
    total: pages.length,
    index: pageIdx,
    current: pages[pageIdx],
    previous: pages[pageIdx - 1],
    next: pageIdx < 0 ? undefined : pages[pageIdx + 1],
  };
};

export async function generatePageMetadata<T extends PageMetadata>(
  pages: T[],
  path: string,
): Promise<T & Metadata> {
  const { current: metadata } = await getPageContext<T>(pages, path);
  return {
    ...metadata!,
    ...(await getOGMetadata({
      title: metadata!.title,
      description: metadata!.description,
      image: metadata!.cover,
    })),
  };
}
