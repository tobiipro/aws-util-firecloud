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

  let inspection = {
    process: processSnapshot,
    os: osSnapshot
  };

  let {
    previousCpuUsage,
    previousMemoryUsage
  } = inspect;

  if (previousMemoryUsage) {
    inspection.process.memoryUsageDiff = {
      rss: previousMemoryUsage.rss - inspection.process.memoryUsage.rss,
      heapUsed: previousMemoryUsage.heapUsed - inspection.process.memoryUsage.heapUsed
    };
  }
  inspect.previousMemoryUsage = {
    rss: inspection.process.memoryUsage.rss,
    heapUsed: inspection.process.memoryUsage.heapUsed
  };

  if (previousCpuUsage) {
    inspection.process.cpuUsageDiff = {
      user: previousCpuUsage.user - inspection.process.cpuUsage.user,
      system: previousCpuUsage.system - inspection.process.cpuUsage.system
    };
  }
  inspect.previousCpuUsage = {
    user: inspection.process.cpuUsage.user,
    system: inspection.process.cpuUsage.system
  };

  ctx.log.trace('Inspection', inspection);
};

export default inspect;
