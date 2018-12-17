module.exports = {
  presets: [
    ['firecloud', {
      '@babel/preset-env': {
        targets: {
          node: '8.10' // Latest AWS Lambda Node.js
        }
      }
    }]
  ],

  sourceMaps: true,

  retainLines: true
};
