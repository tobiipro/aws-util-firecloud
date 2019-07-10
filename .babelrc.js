let _ = require('lodash-firecloud');
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
          node: '10'
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
