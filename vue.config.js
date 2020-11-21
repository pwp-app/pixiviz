const CompressionWebpackPlugin = require('compression-webpack-plugin');
const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;
const zopfli = require('@gfx/zopfli');
const BrotliPlugin = require('brotli-webpack-plugin');

module.exports = {
  devServer: {
    https: true,
    allowedHosts: [
      'pixiviz.pwp.app',
    ],
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
    assetsVersion: '20201121',
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
      navigateFallback: '/',
      navigateFallbackDenylist: [/\/api\//],
      sourcemap: false,
      runtimeCaching: [
        {
          // 静态文件缓存，网络资源优先，7天过期
          handler: 'NetworkFirst',
          options: {
            urlPattern: new RegExp('^https://pixiviz.pwp.app(/.*\\.(html|js|css|jpg|png|webp))?$'),
            cacheName: 'static-files',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 14,
            },
            networkTimeoutSeconds: 10,
          },
        },
        {
          // API缓存，本地资源优先，7天过期
          urlPattern: new RegExp('^https://pixiviz.pwp.app/api/.*$'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'api-return',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 7,
            },
            networkTimeoutSeconds: 30,
          },
        },
        {
          // 作者头像缓存，14天过期，最多缓存200个
          urlPattern: new RegExp('^https://pixiv-image.pwp.link/user-profile/.*$'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'artist-avatar',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 14,
              maxEntries: 200,
            },
            networkTimeoutSeconds: 30,
          },
        },
        {
          // 大图缓存，本地资源优先，7天过期，最多存100张
          urlPattern: new RegExp('^https://pixiv-image.pwp.link/img-original/.*$'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'big-picture',
            cacheableResponse: {
              statuses: [0, 200],
            },
            expiration: {
              maxAgeSeconds: 86400 * 7,
              maxEntries: 100,
            },
            networkTimeoutSeconds: 300,
          },
        },
      ],
    }
  },
  productionSourceMap: false,
  chainWebpack: (config) => {
    config.module
      .rule('images')
      .use('image-webpack-loader')
      .loader('image-webpack-loader')
      .options({
        mozjpeg: { progressive: true, quality: 70 },
        optipng: { enabled: false },
        pngquant: { quality: [0.65, 0.9], speed: 4 },
        gifsicle: { interlaced: false },
      });
    config.optimization.delete("splitChunks");
    if (process.env.NODE_ENV === 'production' && process.env.ANALYZE === 'true') {
      config.plugin('webpack-bundle-analyzer')
        .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin);
    }
  },
  configureWebpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'element-ui': '@pwp-app/better-element-ui',
    };
    config.optimization = {
      splitChunks: {
        cacheGroups: {
          common: {
            name: 'chunk-common',
            chunks: 'initial',
            minChunks: 2,
            maxInitialRequests: 5,
            minSize: 0,
            priority: 1,
            reuseExistingChunk: true,
            enforce: true,
          },
          vendors: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            chunks: 'initial',
            priority: 2,
            reuseExistingChunk: true,
            enforce: true,
          },
          elementUI: {
            name: 'chunk-elementui',
            test: /[\\/]node_modules[\\/]element-ui[\\/]/,
            chunks: 'all',
            priority: 3,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };
    if (process.env.NODE_ENV === 'production') {
      // drop debug lines
      config.optimization.minimizer[0].options.terserOptions.compress.warnings = false
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true
      config.optimization.minimizer[0].options.terserOptions.compress.drop_debugger = true
      config.optimization.minimizer[0].options.terserOptions.compress.pure_funcs = ['console.log']
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
