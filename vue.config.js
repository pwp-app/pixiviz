const CompressionWebpackPlugin = require('compression-webpack-plugin');
const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;
const zopfli = require('@gfx/zopfli');
const BrotliPlugin = require('brotli-webpack-plugin');

module.exports = {
    devServer: {
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
            navigateFallbackBlacklist: [/\/api\//],
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
