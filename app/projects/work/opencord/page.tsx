import { generateProjectPage } from '../../_project';
import Content from './content.mdx';

const path = '/projects/work/opencord';

// @ts-ignore
const p = await generateProjectPage(path, Content);
export const metadata = p.metadata;
export default p.Page;
