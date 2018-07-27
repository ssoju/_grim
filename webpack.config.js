var path = require("path");
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var extractSass = new ExtractTextPlugin('css/style.css');

module.exports = {
    entry: {app: path.resolve(__dirname, "src/app.js")},
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["es2015"]
                    }
                }
            },
            {
                test: /\.ts$/,
                use: ['ts-loader']
            },
            {
                test: /\.(s*)css$/,
                use: extractSass.extract(["css-loader", "sass-loader"])
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, 'src/index.html'),
            inject: true,
            filename: path.join(__dirname, 'dist/index.html')
        }),
        extractSass
    ],
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
    }
};
