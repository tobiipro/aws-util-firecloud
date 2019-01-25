import _ from 'lodash-firecloud';
import os from 'os';

export let inspect = async function({ctx}) {
  if (!ctx.log._canTrace) {
    return;
  }

  // Added in: v6.1.0
  // let cpuUsage = process.cpuUsage(inspect.previousCpuUsage);
  // inspect.previousCpuUsage = cpuUsage;

  let inspection = {
    process: _.merge(_.pick(process, [
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
    ]), {
      // cpuUsage,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    }),
    os: _.mapValues(os, function(fn) {
      if (!_.isFunction(fn)) {
        return;
      }

      return fn();
    })
  };

  let {previousMemoryUsage} = inspect;
  if (previousMemoryUsage) {
    inspection.process.memoryUsageDiff = {
      rss: previousMemoryUsage.rss - inspection.process.memoryUsage.rss,
      heapUsed: previousMemoryUsage.heapUsed - inspection.process.memoryUsage.heapUsed,
      time: previousMemoryUsage.uptime - inspection.process.uptime
    };
    inspect.previousMemoryUsage = {
      rss: inspect.process.memoryUsage.rss,
      heapUsed: inspect.process.memoryUsage.heapUsed,
      uptime: inspect.process.uptime
    };
  }

  ctx.log.trace(inspection, 'Inspection');
};

export default inspect;
