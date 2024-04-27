import { MakeRequired } from '@/common/utils/types';
import {
  generatePageMetadata,
  getPage,
  getPageContext,
  getPages,
  PageContext,
  PageMetadata,
  PagesWithPinned,
} from '@/utils/page';
import { PageFrom } from '@/utils/page/type';

import { PostLayout } from './PostLayout';

export type Post = MakeRequired<PageMetadata, 'createAt' | 'updateAt'>;

export const getPosts = async (): Promise<PagesWithPinned<Post>> => {
  const ctx = (require as any).context('../', true, /^\.\/.*\/content\.mdx$/);
  return getPages<Post>('posts', ctx, {
    buildMetadata: post => {
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
};

export interface PostsGroupedByYear {
  year: string;
  posts: Post[];
}

let kPostsGroupedByYear: PostsGroupedByYear[];
export const getPostsGroupedByYear = async () => {
  if (kPostsGroupedByYear) {
    return kPostsGroupedByYear;
  }
  let year;
  kPostsGroupedByYear = [];
  (await getPosts()).all.forEach(post => {
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
  if (kPostsPinned) {
    return kPostsPinned;
  }
  kPostsPinned = (await getPosts()).pinned;
  return kPostsPinned;
};

let kPostSortedByYear: Post[];
export const getPostSortedByYear = async () => {
  if (kPostSortedByYear) {
    return kPostSortedByYear;
  }
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
  return generatePageMetadata<Post>(await getPostSortedByYear(), path);
}

export const generatePostPage = async (metaURL: string, Content: any) => {
  const path = getPostPagePath(metaURL);
  const metadata = await generatePostMetadata(path);
  return {
    metadata,
    Page: () => (
      <PostLayout path={metadata.path}>
        <Content />
      </PostLayout>
    ),
  };
};

export const getPostPagePath = (metaURL: string) =>
  metaURL.match(/app(\/posts\/.*?)\/page.tsx$/)![1];
