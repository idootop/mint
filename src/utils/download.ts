import got from 'got';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { withRetry } from '@/common/utils/base';
import { kEnvs, writeFile } from '@/common/utils/io';

const kPendingDownloads = {};
const kHttpProxyAgent = new HttpsProxyAgent(kEnvs['http_proxy']);

export const download = async (
  url: string,
  options?: { savePath?: string },
) => {
  const { savePath } = options ?? {};
  // eslint-disable-next-line no-async-promise-executor
  kPendingDownloads[url] ??= new Promise(resolve => {
    console.log(`🔥 开始下载 ${url}`);
    withRetry(() =>
      got(url, {
        agent: {
          http: kHttpProxyAgent,
          https: kHttpProxyAgent,
        },
        decompress: true,
        followRedirect: true,
        responseType: 'buffer',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/117.0',
          Referer: new URL(url).origin,
        },
      })
        .catch(e => {
          console.log(`❌ 下载失败 ${url}\n`, e);
        })
        .then(e => e?.body),
    ).then(async data => {
      if (data) {
        if (savePath) {
          await writeFile(savePath, data);
        }
        console.log(`✅ 下载成功 ${url}`);
        delete kPendingDownloads[url];
      }
      resolve(data);
    });
  });
  return kPendingDownloads[url];
};
