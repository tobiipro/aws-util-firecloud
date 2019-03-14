import _ from 'lodash-firecloud';
import os from 'os';

let _tryInvoke = function(fn) {
  if (!_.isFunction(fn)) {
    return;
  }

  try {
    return fn();
  } catch (_err) {
    // ignore
  }
};

let _diffInspection = function(inspection, previousInspection, path) {
  return _.get(inspection, path) - _.get(previousInspection, path);
};

export let inspect = async function({ctx}) {
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
  }));

  let {
    previousInspection
  } = inspect;
  inspect.previousInspection = inspection;

  if (previousInspection) {
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

  for (let key in inspection) {
    await ctx.log.trace(`Inspecting '${key}'`, inspection[key]);
  }
};

export default inspect;
