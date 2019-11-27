import _ from 'lodash-firecloud';
import os from 'os';

import {
  LambdaContext
} from '../types';

import {
  Fn,
  JsonValue
} from 'lodash-firecloud/types';

type ProcessKeys = keyof NodeJS.Process;

type Inspection = {
  process: {
    [TKey in keyof NodeJS.Process]: JsonValue;
  };
  os: Partial<typeof os>;
  cpuUsageDiff: Partial<NodeJS.Process['cpuUsage']>;
  memoryUsageDiff: Partial<NodeJS.Process['memoryUsage']>;
};

let _tryInvoke = function<T>(fn: T): (T extends Fn ? ReturnType<T> : void) {
  if (!_.isFunction(fn)) {
    return;
  }

  try {
    return fn();
  } catch (_err) {
    // ignore
  }
};

let _diffInspection = function(inspection: object, previousInspection: object, path: string): number {
  return _.get(inspection, path) - _.get(previousInspection, path);
};

export let inspect = _.assign(async function({ctx}: {
  ctx: LambdaContext;
}): Promise<void> {
  if (!ctx.log._canTrace) {
    return;
  }

  let processSnapshot = _.pick(process, [
    'arch',
    'argv',
    'argv0',
    'config',
    'env',
    'execArgv',
    'pid',
    'platform',
    'release',
    'title',
    'version',
    'versions'
  ]);
  _.merge(processSnapshot, _.mapValues(_.pick(process, [
    'cpuUsage',
    'memoryUsage',
    'uptime'
  ]), _tryInvoke));

  let osSnapshot = _.mapValues(_.omit(os, [
    // silence DeprecatedWarnings
    'getNetworkInterfaces',
    'tmpDir'
  ]), _tryInvoke);

  let inspection = JSON.parse(JSON.stringify({
    process: processSnapshot,
    os: osSnapshot
  })) as Inspection;

  let {
    previousInspection
  } = inspect;
  inspect.previousInspection = inspection;

  if (_.isDefined(previousInspection)) {
    inspection.cpuUsageDiff = _.reduce([
      'user',
      'system'
    ], function(acc, key) {
      acc[key] = _diffInspection(inspection, previousInspection, `process.cpuUsage.${key}`);
      return acc;
    }, {});

    inspection.memoryUsageDiff = _.reduce([
      'heapUsed',
      'rss'
    ], function(acc, key) {
      acc[key] = _diffInspection(inspection, previousInspection, `process.memoryUsage.${key}`);
      return acc;
    }, {});
  }

  _.forEach(inspection, function(value, key) {
    ctx.log.trace(`Inspecting '${key}'`, {
      key: value
    });
  });
}, {
  previousInspection: undefined as Inspection
});

export default inspect;
