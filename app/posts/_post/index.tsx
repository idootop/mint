import type { MakeRequired } from '@/common/utils/types';
import {
  generatePageMetadata,
  getPage,
  getPageContext,
  getPages,
  type PageContext,
  type PageMetadata,
  type PagesWithPinned,
} from '@/utils/page';
import { PageFrom } from '@/utils/page/from';

import { pages } from './pages.gen';

export type Post = MakeRequired<PageMetadata, 'createAt' | 'updateAt'>;

export const getPosts = async (): Promise<PagesWithPinned<Post>> => {
  const posts = await getPages<Post>('posts', pages as Post[], {
    buildMetadata: (post) => {
      const createAt = post.createAt ?? '2024-01-01';
      return {
        ...post,
        createAt,
        updateAt: post.updateAt ?? createAt,
      };
    },
    sort: (a, b) => {
      return b.createAt.localeCompare(a.createAt, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    },
  });
  return posts;
};

export interface PostsGroupedByYear {
  year: string;
  posts: Post[];
}

let kPostsGroupedByYear: PostsGroupedByYear[];
export const getPostsGroupedByYear = async () => {
  let year: string;
  kPostsGroupedByYear = [];
  (await getPosts()).all.forEach((post) => {
    const _year = post.createAt.split('-')[0] as any;
    if (_year !== year) {
      kPostsGroupedByYear.push({ year: _year, posts: [post] });
      year = _year;
    } else {
      kPostsGroupedByYear[kPostsGroupedByYear.length - 1].posts.push(post);
    }
  });
  return kPostsGroupedByYear;
};

let kPostsPinned: Post[];
export const getPostsPinned = async () => {
  kPostsPinned = (await getPosts()).pinned;
  return kPostsPinned;
};

let kPostSortedByYear: Post[];
export const getPostSortedByYear = async () => {
  kPostSortedByYear = (await getPostsGroupedByYear()).reduce(
    (pre, v) => [...pre, ...v.posts],
    [] as Post[],
  );
  return kPostSortedByYear;
};

export interface PostContext extends PageContext<Post> {}

export const getPost = async (path: string) => {
  return getPage((await getPosts()).all, path);
};

export const getPostContext = async (
  path: string,
  options?: { from?: PageFrom },
): Promise<PostContext> => {
  const { from = PageFrom.all } = options ?? {};
  return getPageContext(
    from === PageFrom.pinned
      ? await getPostsPinned()
      : await getPostSortedByYear(),
    path,
  );
};

export async function generatePostMetadata(path: string) {
  return generatePageMetadata<Post>((await getPosts()).all, path);
}
