import Promise from 'bluebird';

// override native Promise to get better stacktraces
global.Promise = Promise;
Promise.config({
  warnings: true,
  longStackTraces: true
});
Error.stackTraceLimit = Infinity;
