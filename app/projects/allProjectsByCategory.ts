import { allProjects, Project } from 'contentlayer/generated';

type Category = string;
export interface CategoryProjects {
  category: Category;
  projects: Project[];
}

const projectCategories = ['商业项目', '个人项目', 'Web3', '小工具', '其他'];

const _allProjectsSorted = allProjects.sort((a, b) => {
  return b.date.localeCompare(a.date, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
});

const getProjectsGroupByCategory = () => {
  const categoryProjects = {};
  const projects: CategoryProjects[] = [];
  _allProjectsSorted.forEach(project => {
    const category = project.category ?? '其他';
    if (!categoryProjects[category]) {
      categoryProjects[category] = [];
    }
    categoryProjects[category].push(project);
  });
  for (const category of projectCategories) {
    projects.push({
      category,
      projects: categoryProjects[category] ?? [],
    });
  }
  return projects;
};

export const allProjectsByCategory = getProjectsGroupByCategory();

const getAllProjectsSorted = () => {
  return allProjectsByCategory.reduce((pre, v) => {
    return [...pre, ...v.projects];
  }, [] as Project[]);
};

export const allProjectsSorted = getAllProjectsSorted();
export const allProjectsSortedWithDetails = allProjectsSorted.filter(
  e => e.hasDetail,
);

export interface ProjectProps {
  params: {
    slug: string[];
  };
}

export function getProject(params: ProjectProps['params']) {
  const slug = params?.slug?.join('/');
  return allProjectsSorted.find(project => project.slugAsParams === slug);
}

export function getNextProject(params: ProjectProps['params']) {
  const project = getProject(params)!;
  const idx = allProjectsSortedWithDetails.indexOf(project as any);
  const previous =
    idx - 1 < 0 ? undefined : allProjectsSortedWithDetails[idx - 1];
  const next =
    idx + 1 > allProjectsSortedWithDetails.length - 1
      ? undefined
      : allProjectsSortedWithDetails[idx + 1];
  return {
    idx,
    total: allProjectsSortedWithDetails.length,
    project,
    next,
    previous,
  };
}
