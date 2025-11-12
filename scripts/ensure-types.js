#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const packages = [
  {
    name: '@types/react',
    files: {
      'package.json': JSON.stringify({ name: '@types/react', version: '0.0.0-stub' }, null, 2),
      'index.d.ts': `declare namespace React {
  type ReactNode = any;
  interface FC<P = {}> {
    (props: P & { children?: ReactNode }): ReactNode;
  }
}

declare module 'react' {
  export = React;
}
`
    }
  },
  {
    name: '@types/node',
    files: {
      'package.json': JSON.stringify({ name: '@types/node', version: '0.0.0-stub' }, null, 2),
      'index.d.ts': `declare namespace NodeJS {
  interface ProcessEnv {
    [key: string]: string | undefined;
  }
}
`
    }
  }
];

function ensureStubPackage(pkg) {
  try {
    require.resolve(`${pkg.name}/package.json`);
    return;
  } catch (error) {
    if (error.code !== 'MODULE_NOT_FOUND') {
      throw error;
    }
  }

  const packageDir = path.join(process.cwd(), 'node_modules', ...pkg.name.split('/'));
  fs.mkdirSync(packageDir, { recursive: true });

  for (const [fileName, contents] of Object.entries(pkg.files)) {
    const targetPath = path.join(packageDir, fileName);
    if (!fs.existsSync(targetPath)) {
      fs.writeFileSync(targetPath, contents, 'utf8');
    }
  }
}

for (const pkg of packages) {
  ensureStubPackage(pkg);
}
