import crypto from 'node:crypto';

import { readFile } from '@/common/utils/io';
import { isString } from '@/common/utils/is';

export const hashSha256 = async (dataOrString?: string | Buffer) => {
  if (!dataOrString) {
    return;
  }
  if (isString(dataOrString)) {
    dataOrString = Buffer.from(dataOrString, 'utf8');
  }
  return crypto.createHash('sha256').update(dataOrString).digest('hex');
};

export const checksumFile = async (filePathOrData?: Buffer | string) => {
  let data;
  if (isString(filePathOrData)) {
    data = await readFile(filePathOrData);
  } else {
    // Buffer
    data = filePathOrData;
  }
  return hashSha256(data);
};
