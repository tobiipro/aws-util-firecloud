let _ = require('lodash-firecloud').default;
let minlogDefaultLevels = require('minlog').defaultLevels;

let minlogFuns = _.concat(_.keys(minlogDefaultLevels), [
  'trackTime'
]);

let srcFuns = [];
srcFuns = _.concat(srcFuns, _.map(minlogFuns, function(level) {
  return `ctx.log.${level}`;
}));

module.exports = {
  presets: [
    ['firecloud', {
      '@babel/preset-env': {
        targets: {
          node: '8.10' // Latest AWS Lambda Node.js
        }
      },

      'babel-plugin-firecloud-src-arg': {
        disabled: false,
        srcFuns
      }
    }]
  ],

  sourceMaps: true,

  retainLines: true
};
