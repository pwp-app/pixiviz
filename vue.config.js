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
    }
}