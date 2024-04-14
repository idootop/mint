import { generateProjectPage } from '../../_project';
import Content from './content.mdx';

const path = '/projects/hack/all-seeing-eye';

// @ts-ignore
const p = await generateProjectPage(path, Content);
export const metadata = p.metadata;
export default p.Page;
