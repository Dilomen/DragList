// rollup-plugin-node-resolve 插件可以告诉 Rollup 如何查找外部模块
const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
// 使用babel
const babel = require('rollup-plugin-babel');
const postcss = require('rollup-plugin-postcss')
// amd – 异步模块定义，用于像RequireJS这样的模块加载器
// cjs – CommonJS，适用于 Node 和 Browserify/Webpack
// es – 将软件包保存为ES模块文件
// iife – 一个自动执行的功能，适合作为<script>标签。（如果要为应用程序创建一个捆绑包，您可能想要使用它，因为它会使文件大小变小。）
// umd – 通用模块定义，以amd，cjs 和 iife 为一体

module.exports = {
  input: "./DragList/index.js",
  output: [{
    name: 'index.js',
    file: './lib/index.js',
    format: 'es',
    minify: true,
  }, {
    name: 'index.js',
    file: 'umd/index.js',
    format: 'umd',
    minify: true,
  }, {
    name: 'index.js',
    file: 'cjs/index.js',
    format: 'cjs',
    minify: true,
  }, {
    name: 'DragList',
    file: 'iife/index.js',
    format: 'iife',
    minify: true,
  }],
  plugins: [
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    postcss(),
    commonjs(),
    babel({
      runtimeHelpers: true,
      exclude: 'node_modules/**',
      extensions: ['js', 'jsx']
    })
  ]
}

