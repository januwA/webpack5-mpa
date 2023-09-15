const path = require("path");
const { globSync } = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const outFilename =
  process.env.NODE_ENV === "production" ? "[contenthash:8]" : "[name]";

const setMPA = () => {
  const entry = {};
  const htmlWebpackPlugins = [];

  // 遍历所有入口js文件
  globSync("./src/pages/*/index.js").forEach((file) => {
    const pageName = path.basename(path.dirname(file));
    entry[pageName] = file;

    htmlWebpackPlugins.push(
      new HtmlWebpackPlugin({
        inject: "head", // 将js和css注入到head中，scss需要在js中导入，然后又webpack提取到单独的css文件中
        template: `src/pages/${pageName}/index.html`,
        filename: `${pageName}.html`,
        chunks: [pageName], // 需要添加chunks，需要和entry中的key一样
      })
    );
  });
  return { entry, htmlWebpackPlugins };
};

const { entry, htmlWebpackPlugins } = setMPA();

module.exports = {
  entry,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `js/${outFilename}.js`,
    publicPath: "/",
    clean: true,
  },
  resolve: {
    extensions: [".js"],
    preferRelative: true,

    // 路径别名
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/env"],
            },
          },
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          { loader: "css-loader" },
          {
            // https://webpack.js.org/loaders/postcss-loader/
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  //  将现代CSS转换为大多数浏览器可以理解的内容
                  // https://github.com/csstools/postcss-plugins
                  ["postcss-preset-env", {}],
                  [
                    // https://github.com/evrone/postcss-px-to-viewport
                    "postcss-px-to-viewport",
                    {
                      unitToConvert: "px", // 需要转换的单位，默认为"px"
                      viewportWidth: 393, // 设计稿的视口宽度
                      unitPrecision: 5, // 单位转换后保留的精度
                      propList: ["*"], // 能转化为vw的属性列表
                      viewportUnit: "vw", // 希望使用的视口单位
                      fontViewportUnit: "vw", // 字体使用的视口单位
                      selectorBlackList: [], // 需要忽略的CSS选择器
                      minPixelValue: 1, // 小于或等于`1px`不转换为视口单位
                      mediaQuery: false, // 允许在媒体查询中转换`px`
                      replace: true, // 是否直接更换属性值，而不添加备用属性
                      exclude: [/node_modules/i], // 忽略某些文件夹下的文件或特定文件，例如 'node_modules' 下的文件
                      landscape: false, // 是否添加根据 landscapeWidth 生成的媒体查询条件 @media (orientation: landscape)
                      landscapeUnit: "vw", // 横屏时使用的单位
                      landscapeWidth: 568, // 横屏时使用的视口宽度
                    },
                  ],
                ],
              },
            },
          },
          {
            // https://webpack.js.org/loaders/sass-loader/
            loader: "sass-loader",
            options: {
              // 全局配置
              // @use: https://sass-lang.com/documentation/at-rules/use
              additionalData: `@use "global.scss" as *;`,
              sassOptions: {
                includePaths: ["./"],
              },
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: true,
    usedExports: false,
    splitChunks: {
      minSize: 10,
      cacheGroups: {
        common: {
          // test: /\.js$/i,
          test: /src[\\/]common[\\/]/,
          name: "common", // 指定包名，不指定时使用上层key作为包名
          chunks: "all",
          priority: 0,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          chunks: "all",
          priority: 10,
        },
      },
    },
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: `css/${outFilename}.css`,
      chunkFilename: "[id].css",
    }),

    ...htmlWebpackPlugins,

    // 复制静态文件
    new CopyPlugin({
      patterns: [
        {
          from: path.relative(__dirname, "public"),
          to: "public",
        },
      ],
    }),
  ],
  experiments: {
    topLevelAwait: true,
    outputModule: false,
  },
  devServer: {
    port: 8080, // 端口号
    open: false, // 自动打开浏览器
    host: "localhost",
    compress: true,
    hot: false,
    static: path.join(__dirname, "dist"), // 静态资源目录
    devMiddleware: {
      stats: "errors-only",
      writeToDisk: true, // 结果输出到磁盘
    },
    client: {
      overlay: {
        // warnings: true,
        errors: true,
      },
    },
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        secure: false,
        changeOrigin: true,
      },
    },
  },
};
