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

import { ProjectLayout } from './ProjectLayout';

const kProjectCategories = [
  'work',
  'product',
  'ai',
  'game',
  'web3',
  'tool',
  'explore',
  'hack',
  'package',
  'develop',
  'document',
  'other',
];

export const kProjectCategoryNames = {
  work: '工作',
  product: '产品',
  ai: 'AI',
  game: '游戏',
  web3: 'Web3',
  tool: '小工具',
  explore: '探索',
  hack: '逆向/安全',
  package: '开源库',
  develop: '开发',
  document: '文档',
  other: '其他',
};

export type Project = MakeRequired<PageMetadata, 'createAt' | 'updateAt'> & {
  emoji: string;
  /**
   * 项目分类
   */
  category: string;
  /**
   * 预览地址
   */
  preview?: string;
  /**
   * 源代码
   */
  source?: string;
};

export const getProjects = async (): Promise<PagesWithPinned<Project>> => {
  const ctx = (require as any).context('../', true, /^\.\/.*\/content\.mdx$/);
  return getPages<Project>('projects', ctx, {
    buildMetadata: project => {
      const createAt = project.createAt ?? '2024-01-01';
      const category = project.path.split('/')[2] ?? 'other';
      return {
        ...project,
        createAt,
        updateAt: project.updateAt ?? createAt,
        category: project.category ?? category,
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

export interface ProjectsGroupedByCategory {
  category: string;
  projects: Project[];
}

const kProjectsGroupedByCategory: ProjectsGroupedByCategory[] = [];
export const getProjectsGroupedByCategory = async () => {
  if (kProjectsGroupedByCategory.length > 0) {
    return kProjectsGroupedByCategory;
  }
  const categoryProjects = {};
  (await getProjects()).all.forEach(project => {
    const category = project.category;
    if (!categoryProjects[category]) {
      categoryProjects[category] = [];
    }
    categoryProjects[category].push(project);
  });
  for (const category of kProjectCategories) {
    kProjectsGroupedByCategory.push({
      category,
      projects: categoryProjects[category] ?? [],
    });
  }
  return kProjectsGroupedByCategory;
};

const kProjectsPinned: Project[] = [];
export const getProjectsPinned = async () => {
  if (kProjectsPinned.length > 0) {
    return kProjectsPinned;
  }
  (await getProjects()).pinned.forEach(project => {
    kProjectsPinned.push(project);
  });
  return kProjectsPinned;
};

let kProjectSortedByCategory: Project[] = [];
export const getProjectsSortedByCategory = async () => {
  if (kProjectSortedByCategory.length > 0) {
    return kProjectSortedByCategory;
  }
  kProjectSortedByCategory = (await getProjectsGroupedByCategory()).reduce(
    (pre, v) => [...pre, ...v.projects],
    [] as Project[],
  );
  return kProjectSortedByCategory;
};

export interface ProjectContext extends PageContext<Project> {}

export const getProject = async (path: string) => {
  return getPage((await getProjects()).all, path);
};

export const getProjectContext = async (
  path: string,
  options?: { from?: PageFrom },
): Promise<ProjectContext> => {
  const { from = PageFrom.all } = options ?? {};
  return getPageContext(
    from === PageFrom.pinned
      ? await getProjectsPinned()
      : await getProjectsSortedByCategory(),
    path,
  );
};

export async function generateProjectMetadata(path: string) {
  return generatePageMetadata<Project>(
    await getProjectsSortedByCategory(),
    path,
  );
}

export const generateProjectPage = async (metaURL: string, Content: any) => {
  const path = getProjectPagePath(metaURL);
  const metadata = await generateProjectMetadata(path);
  return {
    metadata,
    Page: () => (
      <ProjectLayout path={metadata.path}>
        <Content />
      </ProjectLayout>
    ),
  };
};

export const getProjectPagePath = (metaURL: string) =>
  metaURL.match(/app(\/projects\/.*?)\/page.tsx$/)![1];
