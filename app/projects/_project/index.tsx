import { MakeRequired } from '@/common/utils/types';
import {
  generatePageMetadata,
  getPageContext,
  getPages,
  PageContext,
  PageMetadata,
} from '@/utils/page';

import { ProjectLayout } from './ProjectLayout';

const kProjectCategories = [
  'work',
  'side-project',
  'package',
  'ai',
  'web3',
  'hack',
  'tool',
  'other',
];

export const kProjectCategoryNames = {
  work: '商业项目',
  'side-project': '个人项目',
  package: '开源库',
  ai: 'AI',
  web3: 'Web3',
  hack: '逆向/安全',
  tool: '小工具',
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

export const getProjects = async (): Promise<Project[]> => {
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
  (await getProjects()).forEach(project => {
    if (project.isHidden) {
      return;
    }
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

let kProjectSortedByCategory: Project[] = [];
export const getProjectsSortedByCategory = async () => {
  if (kProjectSortedByCategory.length > 0) {
    return kProjectSortedByCategory;
  }
  kProjectSortedByCategory = (await getProjectsGroupedByCategory()).reduce(
    (pre, v) => {
      return [...pre, ...v.projects];
    },
    [] as Project[],
  );
  return kProjectSortedByCategory;
};

export interface ProjectContext extends PageContext<Project> {}

export const getProjectContext = async (
  path: string,
): Promise<ProjectContext> => {
  return getPageContext(await getProjectsSortedByCategory(), path);
};

export async function generateProjectMetadata(path: string) {
  return generatePageMetadata<Project>(
    await getProjectsSortedByCategory(),
    path,
  );
}

export const generateProjectPage = async (path: string, Content: any) => {
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
