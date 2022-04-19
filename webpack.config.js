const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const LwcWebpackPlugin = require('lwc-webpack-plugin');
const path = require('path');

const config = {
    entry: './client/src/index.js',
    mode: 'production',
    output: {
        path: path.resolve('dist'),
        filename: './[name].js'
    },
    plugins: [
        new LwcWebpackPlugin({
            modules: [
                { dir: 'client/src' },
                { npm: 'lightning-base-components' }
            ]
        }),
        new HtmlWebpackPlugin({
            template: 'client/assets/index.html',
            filename: './index.html',
            title: 'main'
        })
    ],
    stats: { assets: false }
};

// production only
if (process.env.NODE_ENV !== 'production') {
    config.plugins.push(new CleanWebpackPlugin());
    config.plugins.push(
        new CopyPlugin({
            patterns: [
                {
                    from: 'client/assets',
                    to: 'assets/'
                },
                {
                    from: 'node_modules/@salesforce-ux/design-system/assets/images',
                    to: 'assets/images'
                },
                {
                    from: 'node_modules/@salesforce-ux/design-system/assets/icons',
                    to: 'assets/icons'
                },
                {
                    from: 'node_modules/@salesforce-ux/design-system/assets/styles/salesforce-lightning-design-system.min.css',
                    to: 'assets/styles/salesforce-lightning-design-system.min.css'
                }
            ]
        })
    );
}

// development only
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
    config.mode = 'development';
    config.devtool = 'source-map';
    config.watchOptions = {
        ignored: /node_modules/,
        aggregateTimeout: 5000
    };
}

module.exports = config;
