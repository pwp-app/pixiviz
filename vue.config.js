/* eslint-disable no-param-reassign */
const webpack = require('webpack');
const CompressionWebpackPlugin = require('compression-webpack-plugin');
const zopfli = require('@gfx/zopfli');
const BrotliPlugin = require('brotli-webpack-plugin');
const NodePolyFillPlugin = require('node-polyfill-webpack-plugin');
const path = require('path');
const fs = require('fs');

const pixivizConf = JSON.parse(fs.readFileSync(path.resolve(__dirname, './src/config.json')));

const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;

module.exports = {
  devServer: {
    server: {
      type: 'https',
    },
    allowedHosts: ['pixiviz.pwp.app'],
    proxy: {
      '/api': {
        target: 'https://pixiviz.pwp.app/api',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
      },
    },
  },
  pwa: {
    name: 'Pixiviz',
    themeColor: '#fafafa',
    msTileColor: '#da7a85',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    manifestOptions: {
      start_url: '.',
      background_color: '#fafafa',
    },
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      // importWorkboxFrom: 'local',
      // importsDirectory: 'js',
      // navigateFallbackAllowlist: [/^\/api\//],
      runtimeCaching: [
        {
          // 静态文件缓存，网络资源优先，7天过期
          urlPattern: /^https:\/\/pixiviz\.pwp\.app(\/.*\.(html|js|css))?$/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'static-files',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 7,
            },
            networkTimeoutSeconds: 10,
          },
        },
        {
          // 静态图片缓存，本地资源优先，3天过期
          urlPattern: /^https:\/\/pixiviz\.pwp\.app(\/.*\.(jpg|jpeg|png|webp|svg))?$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'static-imgs',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 3,
            },
          },
        },
        // 统计代码缓存
        {
          urlPattern: /^(https:\/\/hm\.baidu\.com\/hm\.js)|(https:\/\/cdn-go\.cn\/aegis\/aegis-sdk\/latest\/aegis\.min\.js)/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'stat-files',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 3,
            },
          },
        },
        {
          // API缓存，本地资源优先，7天过期，最多3w条
          urlPattern: /^https:\/\/((pixiviz\.pwp\.app\/api\/)|(pixiviz-api-[a-z]{2}\.pwp\.link\/)).+/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'api-return',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 7,
              maxEntries: 30000,
            },
          },
        },
        {
          // 作者头像缓存，14天过期，最多缓存1000个
          urlPattern: /^https:\/\/pixiv-image(-[a-z]{2})?\.pwp\.link\/user-profile\/.*$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'artist-avatar',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 30,
              maxEntries: 1000,
            },
            fetchOptions: {
              credentials: 'omit',
              mode: 'cors',
            },
          },
        },
        {
          // 小图缓存，最多1000个
          urlPattern: /^https:\/\/pixiv-image(-[a-z]{2})?\.pwp\.link\/.+\/img-master\/.*$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'pic-master',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400, // cache for 3h
              maxEntries: 1000,
            },
            fetchOptions: {
              credentials: 'omit',
              mode: 'cors',
            },
          },
        },
        {
          // zip缓存，最多缓存10个，有效期3天
          urlPattern: /^https:\/\/pixiv-image(-[a-z]{2})?\.pwp\.link\/.*\.zip$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'ugoira-zip',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 3,
              maxEntries: 10,
            },
            fetchOptions: {
              credentials: 'omit',
              mode: 'cors',
            },
          },
        },
        // gfont缓存，最多缓存50个
        {
          urlPattern: /^https:\/\/gfonts\.pwp\.link\/.*$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gfont',
            cacheableResponse: {
              statuses: [200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 90,
              maxEntries: 500,
            },
            fetchOptions: {
              credentials: 'omit',
              mode: 'cors',
            },
          },
        },
        // 发电头像缓存，最多缓存50个
        {
          urlPattern: /^https:\/\/pic1\.afdiancdn\.com\/.*$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'sponsor-avatar',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400,
              maxEntries: 50,
            },
            fetchOptions: {
              credentials: 'omit',
              mode: 'cors',
            },
          },
        },
      ],
    },
  },
  productionSourceMap: false,
  chainWebpack: (config) => {
    config.plugin('pixiviz-flags').use(webpack.DefinePlugin, [
      {
        __ROOT_URL__: JSON.stringify(pixivizConf.website_url),
      },
    ]);
    config.plugin('node-polyfill').use(NodePolyFillPlugin);
    // drop debug lines
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimizer('terser').tap((args) => {
        args[0].terserOptions.compress.drop_console = false;
        args[0].terserOptions.compress.warnings = false;
        args[0].terserOptions.compress.drop_debugger = true;
        args[0].terserOptions.compress.pure_funcs = ['console.debug'];
        return args;
      });
    }
    if (process.env.NODE_ENV === 'production' && process.env.ANALYZE === 'true') {
      config
        .plugin('webpack-bundle-analyzer')
        .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);
    }
  },
  configureWebpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'element-ui': '@pwp-app/better-element-ui',
      'vue-lazyload': '@pwp-app/vue-lazyload',
      'vue-context-menu': '@pwp-app/vue-context-menu',
    };
    config.optimization.splitChunks = {
      cacheGroups: {
        basic: {
          name: 'chunk-basic',
          test: /[\\/]node_modules[\\/](@?vue)|(babel)|(level)|(axios)|(qs)|(dayjs)[\\/]/,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
        element: {
          name: 'chunk-element',
          test: /[\\/]node_modules[\\/]@pwp-app[\\/]better-element-ui[\\/]/,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
        core: {
          name: 'chunk-core',
          test: /[\\/]node_modules[\\/]core-js[\\/]/,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
          enforce: true,
        },
        vendors: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          priority: 1,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    };
    if (process.env.NODE_ENV === 'production') {
      // compress
      return {
        plugins: [
          new CompressionWebpackPlugin({
            algorithm(input, compressionOptions, callback) {
              return zopfli.gzip(input, compressionOptions, callback);
            },
            compressionOptions: {
              numiterations: 15,
            },
            minRatio: 0.75,
            test: productionGzipExtensions,
          }),
          new BrotliPlugin({
            test: productionGzipExtensions,
            minRatio: 0.75,
          }),
        ],
      };
    }
  },
};
