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
import { PageFrom } from '@/utils/page/from';

import { ProjectLayout } from './ProjectLayout';

const kProjectCategories = [
  'work',
  'product',
  'ai',
  'game',
  'explore',
  'web3',
  'tool',
  'hack',
  'package',
  'develop',
  'other',
];

export const kProjectCategoryNames = {
  work: '商业项目',
  product: '个人项目',
  ai: 'AI',
  game: '游戏',
  web3: 'Web3',
  explore: '探索',
  tool: '小工具',
  hack: 'Hacker',
  package: 'Packages',
  develop: 'Developer',
  other: '其他',
};

export const getProjectCategoryName = (key: string) => {
  return kProjectCategoryNames[key] ?? '其他';
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

const groupProjectsByCategory = (projects: Project[]) => {
  const categoryProjects = {};
  const projectsGroupedByCategory: ProjectsGroupedByCategory[] = [];
  projects.forEach(project => {
    const category = project.category;
    if (!categoryProjects[category]) {
      categoryProjects[category] = [];
    }
    categoryProjects[category].push(project);
  });
  for (const category of kProjectCategories) {
    projectsGroupedByCategory.push({
      category,
      projects: categoryProjects[category] ?? [],
    });
  }
  return projectsGroupedByCategory;
};

let kProjectsGroupedByCategory: ProjectsGroupedByCategory[];
export const getProjectsGroupedByCategory = async () => {
  if (kProjectsGroupedByCategory) {
    return kProjectsGroupedByCategory;
  }
  kProjectsGroupedByCategory = groupProjectsByCategory(
    (await getProjects()).all,
  );
  return kProjectsGroupedByCategory;
};

let kProjectsPinned: Project[];
export const getProjectsPinned = async () => {
  if (kProjectsPinned) {
    return kProjectsPinned;
  }
  const pinned = (await getProjects()).pinned;
  const middleStart = pinned.findIndex(e => !e.pinnedIndex);
  const middleEnd = pinned.findLastIndex(e => !e.pinnedIndex);
  if (middleStart === middleEnd) {
    kProjectsPinned = pinned;
  } else {
    // sort middle project by category
    const tops = pinned.slice(0, middleStart);
    const middles = pinned.slice(middleStart, middleEnd + 1);
    const middlesGroupedByCategory = groupProjectsByCategory(middles).reduce(
      (pre, v) => [...pre, ...v.projects],
      [] as Project[],
    );
    const bottoms = pinned.slice(middleEnd + 1);
    kProjectsPinned = [...tops, ...middlesGroupedByCategory, ...bottoms];
  }
  return kProjectsPinned;
};

let kProjectSortedByCategory: Project[];
export const getProjectsSortedByCategory = async () => {
  if (kProjectSortedByCategory) {
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
