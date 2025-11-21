const path = require('path');
const webpack = require('webpack');
const ModuleFederationPlugin = require('webpack').container.ModuleFederationPlugin;

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production' || process.env.NODE_ENV === 'production';
  
  // Debug: Check if GEMINI_API_KEY is available
  const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'AIzaSyA5AH7ZVz88dgKmRyvY_qlfpY3v7fYSXVI';
  console.log('Webpack config - GEMINI_API_KEY from env:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');
  console.log('Webpack config - VITE_GEMINI_API_KEY from env:', process.env.VITE_GEMINI_API_KEY ? 'SET' : 'NOT SET');
  console.log('Webpack config - Using key:', geminiKey.substring(0, 10) + '...');
  
  return {
  mode: isProduction ? 'production' : 'development',
  entry: './src/index.tsx',
  devtool: isProduction ? false : 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true,
    // Use full URL in production so chunks load from the correct domain
    publicPath: isProduction 
      ? 'https://hotcode-chat-module.web.app/'
      : 'http://localhost:3002/',
    environment: {
      module: false,
    },
  },
  devServer: {
    port: 3002,
    hot: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: {
      '@erp/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@erp/theme': path.resolve(__dirname, '../../packages/theme/src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: true,
            compilerOptions: {
              noEmit: false
            }
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.jsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            transpileOnly: true,
            compilerOptions: {
              noEmit: false,
              jsx: 'react-jsx',
              allowJs: true
            }
          }
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiKey),
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiKey),
    }),
    new ModuleFederationPlugin({
      name: 'chat_module',
      filename: 'remoteEntry.js',
      exposes: {
        './Module': './src/index.tsx',
      },
      shared: {
        react: {
          singleton: true,
          eager: true,
          requiredVersion: '^19.0.0',
        },
        'react-dom': {
          singleton: true,
          eager: true,
          requiredVersion: '^19.0.0',
        },
        'react-router-dom': {
          singleton: true,
          eager: true,
          requiredVersion: '^7.0.2',
        },
        firebase: {
          singleton: true,
        },
        '@google/genai': {
          singleton: true,
        },
      },
    }),
  ],
  };
};

