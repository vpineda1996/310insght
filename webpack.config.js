const path = require("path");
const webpack = require('webpack');
const WebpackNotifierPlugin = require('webpack-notifier');

module.exports = {
    entry: "./src/ui/index.tsx",
    output: {
        filename: "bundle.js",
        path: path.join(__dirname,"public","src","static","js"),
        publicPath: "/js"
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
        alias: {
            "ag-grid-root" : __dirname + "/node_modules/ag-grid"
        }
    },

    module: {
        loaders: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
            { 
                test: /\.tsx?$/, 
                loader: "react-hot-loader/webpack!ts-loader",
                include: [ path.join(__dirname,"src","ui") ]
            },
            {
                test: /\.s?css$/,
                loaders: ["style", "css", "sass"]
            }
        ],

        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    },

    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }),
        // new webpack.optimize.DedupePlugin(),
        // new webpack.optimize.OccurenceOrderPlugin(),
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: { warnings: false },
        //     mangle: true,
        //     sourcemap: false,
        //     beautify: false,
        //     dead_code: true
        // }),
        new WebpackNotifierPlugin()
    ],
    sassLoader: {
        includePaths: [path.resolve(__dirname, 'src', 'ui', 'styles')]
    },

    devServer: {
        contentBase: path.resolve(__dirname, 'public', 'src', 'static'),
        host: '0.0.0.0',
        port: 8000,
        proxy: [{
            context: ['/query*', '/dataset/*', '/bruteforce*'],
            target: 'http://localhost:4321',
            secure: false
        }]
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
        "jquery": "jQuery",
        "jQuery": "jQuery",
        "$": "jQuery"
    }
};