const CompressionWebpackPlugin = require("compression-webpack-plugin");
const productionGzipExtensions = /\.(js|css|json|txt|html|ico|svg)(\?.*)?$/i;
const path = require('path');

module.exports = {
    devServer: {
        proxy: {
            '/api': {
                target: 'https://pixiviz.pwp.app/api',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    },
    runtimeCompiler: false,
    productionSourceMap: false,
    chainWebpack: (config) => {
        config.module
          .rule("images")
          .use("image-webpack-loader")
          .loader("image-webpack-loader")
          .options({
              mozjpeg: { progressive: true, quality: 70 },
              optipng: { enabled: false },
              pngquant: { quality: [0.65, 0.9], speed: 4 },
              gifsicle: { interlaced: false },
              webp: { quality: 75 }
          });
        config.module
          .rule("images")
          .use("url-loader")
          .loader("url-loader")
          .tap((options) => {
            options.fallback.options.name = "img/[name].[ext]"
            return options
          });
    },
    configureWebpack: () => {
        if (process.env.NODE_ENV !== 'production') return;
        return {
            plugins: [
                new CompressionWebpackPlugin({
                    filename: "[path].gz[query]",
                    algorithm: "gzip",
                    test: productionGzipExtensions,
                    threshold: 10240,
                    minRatio: 0.8
                })
            ],
        };
    }
}