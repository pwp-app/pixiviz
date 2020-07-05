module.exports = {
    devServer: {
        proxy: {
            '/api': {
                target: 'https://pixivc.pwp.app/api',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    }
}