import _ from 'lodash-firecloud';

// FIXME backward compat
export let envProxy = _.safeProxy;

export let current = _.safeProxy(process.env);

// FIXME backward compat alias
export let env = current;

export default current;
