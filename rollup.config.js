import path from 'path';
import pkg from './package.json';
// import { nodeResolve } from '@rollup/plugin-node-resolve';
// import commonjs from '@rollup/plugin-commonjs';
import license from 'rollup-plugin-license';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';

// const input = '.build/index.js';

const buildOptions = [
  {
    input: '.build/report.js',
    output: {
      file: pkg.main,
      format: 'umd',
      name: 'ReportCore',
    },
    plugins: [
      terser(),
      license({
        banner: {
          content: {
            file: path.join(__dirname, 'LICENSE'),
            encoding: 'utf-8', // Default is utf-8
          },
        },
      }),
    ],
  },
  {
    input: '.build/index.js',
    output: {
      dir: './dist/esm',
      format: 'esm',
      preserveModules: true,
    },
  },
  {
    input: './.build/index.d.ts',
    output: [{ file: pkg.types, format: 'es' }],
    plugins: [dts()],
  },
];

export default buildOptions;
