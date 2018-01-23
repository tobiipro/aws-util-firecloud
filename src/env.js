import _ from 'lodash-firecloud';

export let envProxy = function({env}) {
  return new Proxy(env, {
    get: function(target, property, _receiver) {
      if (property === '_') {
        return target;
      }
      if (!_.isString(target[property])) {
        throw new Error(`env.${property} is undefined.`);
      }
      return target[property];
    }
  });
};

export let env = exports.envProxy({env: process.env});

export default env;
