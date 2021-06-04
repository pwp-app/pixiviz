/* eslint-disable no-param-reassign */
const CompressionWebpackPlugin = require('compression-webpack-plugin');

const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;
const zopfli = require('@gfx/zopfli');
const BrotliPlugin = require('brotli-webpack-plugin');

module.exports = {
  devServer: {
    https: true,
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
    themeColor: '#da7a85',
    msTileColor: '#da7a85',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black-translucent',
    manifestOptions: {
      start_url: '.',
      background_color: '#da7a85',
    },
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true,
      importWorkboxFrom: 'local',
      importsDirectory: 'js',
      navigateFallbackBlacklist: [/^\/api\//],
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
          urlPattern: /^(https:\/\/hm\.baidu\.com\/hm\.js)|(https:\/\/frontjs-static\.pgyer\.com\/dist\/current\/frontjs\.web\.min\.js)/,
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
          urlPattern: /^https:\/\/pixiviz\.pwp\.app\/api\/.*$/,
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
          // 作者头像缓存，14天过期，最多缓存3000个
          urlPattern: /^https:\/\/pixiv-image(-((ru)|(jp)))?\.pwp\.link\/user-profile\/.*$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'artist-avatar',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 30,
              maxEntries: 3000,
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
    config.module
      .rule('images')
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: { progressive: true, quality: 80 },
        optipng: { enabled: false },
        pngquant: { quality: [0.7, 0.95], speed: 4 },
        gifsicle: { interlaced: false },
      });
    // drop debug lines
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimizer('terser').tap((args) => {
        args[0].terserOptions.compress.drop_console = false;
        args[0].terserOptions.compress.warnings = false;
        args[0].terserOptions.compress.drop_debugger = true;
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
          test: /[\\/]node_modules[\\/]vue|babel|level|axios/,
          chunks: 'initial',
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
        vendors: {
          name: 'chunk-vendors',
          test: /[\\/]node_modules[\\/]/,
          chunks: 'all',
          minChunks: 1,
          maxInitialRequests: 5,
          minSize: 0,
          priority: -1,
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
