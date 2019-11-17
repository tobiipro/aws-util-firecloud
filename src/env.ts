import _ from 'lodash-firecloud';

import {
  Env
} from './types';

// FIXME backward compat
export let envProxy = _.safeProxy.bind(_);

export let current = _.safeProxy(process.env) as Env;

// FIXME backward compat alias
export let env = current;

export default current;
