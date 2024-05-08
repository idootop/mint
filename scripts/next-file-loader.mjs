import { interpolateName } from 'loader-utils';
import path from 'path';

const nextRuntime2CompilerType = runtime => {
  return runtime === 'edge'
    ? 'edge-server'
    : runtime === 'nodejs'
      ? 'server'
      : 'client';
};

export const nextFileLoader = ({ config, options, test, outputPath }) => {
  return {
    test,
    loader: path.join(process.cwd(), 'scripts', 'next-file-loader.mjs'),
    issuer: { not: /\.(css|scss|sass)$/ },
    dependency: { not: ['url'] },
    resourceQuery: {
      not: [
        new RegExp('__next_metadata__'),
        new RegExp('__next_metadata_route__'),
        new RegExp('__next_metadata_image_meta__'),
      ],
    },
    options: {
      outputPath,
      isDev: options.dev,
      basePath: config.basePath,
      assetPrefix: config.assetPrefix,
      compilerType: nextRuntime2CompilerType(options.nextRuntime),
    },
  };
};

export default function loader(content) {
  const { compilerType, isDev, basePath, assetPrefix, outputPath } =
    this.getOptions();
  const context = this.rootContext;
  const opts = { context, content };
  console.log('resourcePath', this.resourcePath);
  const interpolatedName = interpolateName(this, outputPath, opts);
  const prefix = (basePath || assetPrefix || '') + '/_next';
  const src = prefix + interpolatedName;
  const stringifiedData = JSON.stringify({
    src: src,
  });
  if (compilerType === 'client') {
    this.emitFile(interpolatedName, content, null);
  } else {
    this.emitFile(
      path.join(
        '..',
        isDev || compilerType === 'edge-server' ? '' : '..',
        interpolatedName,
      ),
      content,
      null,
    );
  }
  return `export default ${stringifiedData};`;
}

export const raw = true;
