import _ from 'lodash-firecloud';
import os from 'os';

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
  _.merge(processSnapshot, {
    cpuUsage: process.cpuUsage(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  });

  let osSnapshot = _.mapValues(os, function(fn) {
    if (!_.isFunction(fn)) {
      return;
    }

    return fn();
  });

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
