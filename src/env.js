import _ from 'lodash-firecloud';

export let envProxy = function({env}) {
  // eslint-disable-next-line fp/no-proxy
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

export let current = envProxy({env: process.env});

// backward compat alias
export let env = current;

export default current;
