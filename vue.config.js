module.exports = {
    devServer: {
        proxy: {
            '/api': {
                target: 'http://localhost:7702',
                changeOrigin: true,
                pathRewrite: {
                    '^/api': ''
                }
            }
        }
    }
}