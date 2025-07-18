import type { Metadata } from 'next';

import { getOGMetadata } from '../metadata';

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
  hidden?: boolean;
  /**
   * 排序
   *
   * +1 ~ +N：置顶排序（从前往后：+1，+2，+3...）
   *
   * -1 ~ -N：置底排序（从前往后：-1，-2，-3...）
   */
  index?: string;
  /**
   * 是否置顶（精选）
   */
  pinned?: boolean;
  pinnedIndex?: string;
  createAt?: string;
  updateAt?: string;
}

interface SortedPages<T extends PageMetadata> {
  top: T[];
  middle: T[];
  bottom: T[];
}
export type PagesWithPinned<T extends PageMetadata> = {
  all: T[];
  pinned: T[];
};
const kPages: Record<string, any> = {};
export const getPages = async <T extends PageMetadata>(
  category: string,
  ctx: any,
  options?: {
    buildMetadata?: (T) => T;
    sort?: (a: T, b: T) => number;
  },
): Promise<PagesWithPinned<T>> => {
  const { sort, buildMetadata } = options ?? {};
  if (kPages[category]) {
    return kPages[category];
  }
  // 导入
  const pages = ctx.keys().map((filePath) => {
    const page = ctx(filePath);
    const path = `/${category}/${filePath.slice(2).replace(/\/content\.mdx$/, '')}`;
    return { path, ...page.metadata };
  });
  // 排序
  const sortedPages: { all: SortedPages<T>; pinned: SortedPages<T> } = {
    all: { top: [], middle: [], bottom: [] },
    pinned: { top: [], middle: [], bottom: [] },
  };
  for (let page of pages) {
    if (buildMetadata) {
      page = buildMetadata(page); // metadata 预处理
    }
    if (page.index) {
      if (page.index.startsWith('-')) {
        sortedPages.all.bottom.push(page);
      } else {
        sortedPages.all.top.push(page);
      }
    } else {
      sortedPages.all.middle.push(page);
    }
    if (page.pinned) {
      if (page.pinnedIndex) {
        if (page.pinnedIndex.startsWith('-')) {
          sortedPages.pinned.bottom.push(page);
        } else {
          sortedPages.pinned.top.push(page);
        }
      } else {
        sortedPages.pinned.middle.push(page);
      }
    }
  }
  if (sort) {
    sortedPages.all.middle = sortedPages.all.middle.sort(sort);
    sortedPages.pinned.middle = sortedPages.pinned.middle.sort(sort);
  }
  sortedPages.all.top = sortedPages.all.top.sort(
    (a, b) =>
      parseFloat(a.index!.replace('+', '')) -
      parseFloat(b.index!.replace('+', '')),
  );
  sortedPages.pinned.top = sortedPages.pinned.top.sort(
    (a, b) =>
      parseFloat(a.pinnedIndex!.replace('+', '')) -
      parseFloat(b.pinnedIndex!.replace('+', '')),
  );
  sortedPages.all.bottom = sortedPages.all.bottom.sort(
    (a, b) =>
      parseFloat(a.index!.replace('-', '')) -
      parseFloat(b.index!.replace('-', '')),
  );
  sortedPages.pinned.bottom = sortedPages.pinned.bottom.sort(
    (a, b) =>
      parseFloat(a.pinnedIndex!.replace('-', '')) -
      parseFloat(b.pinnedIndex!.replace('-', '')),
  );
  kPages[category] = {
    all: [
      ...sortedPages.all.top,
      ...sortedPages.all.middle,
      ...sortedPages.all.bottom,
    ],
    pinned: [
      ...sortedPages.pinned.top,
      ...sortedPages.pinned.middle,
      ...sortedPages.pinned.bottom,
    ],
  };
  return kPages[category];
};

export interface PageContext<T extends PageMetadata> {
  previous?: T;
  next?: T;
}

export const getPage = async <T extends PageMetadata>(
  pages: T[],
  path: string,
) => {
  return pages.find((e) => e.path === path);
};

export const getPageContext = async <T extends PageMetadata>(
  pages: T[],
  path: string,
): Promise<PageContext<T>> => {
  const ctxPages = pages.filter((e) => !e.hidden);
  const ctxIdx = ctxPages.findIndex((e) => e.path === path);
  return {
    previous: ctxPages[ctxIdx - 1],
    next: ctxIdx < 0 ? undefined : ctxPages[ctxIdx + 1],
  };
};

export async function generatePageMetadata<T extends PageMetadata>(
  pages: T[],
  path: string,
): Promise<T & Metadata> {
  const metadata = await getPage<T>(pages, path);
  return {
    ...metadata!,
    ...(await getOGMetadata({
      title: metadata!.title,
      description: metadata!.description,
      image: metadata!.cover,
    })),
  };
}
