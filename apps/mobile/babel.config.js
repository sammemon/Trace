module.exports = {
  presets: ['babel-preset-expo'],
  transform: {
    exclude: [
      'node_modules/@babel/runtime',
      'node_modules/@shopify',
      'node_modules/expo',
      'node_modules/react-native',
    ],
  },
  transformer: {
    minifierPath: 'esbuild-minify-transformer',
    minifierConfig: {},
  },
};
