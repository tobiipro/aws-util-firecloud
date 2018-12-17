// override native Promise to get better stacktraces
try {
  let originalPromise = global.Promise;

  // eslint-disable-next-line global-require, import/no-extraneous-dependencies
  let Promise = require('bluebird');
  global.Promise = Promise;

  Promise.original = originalPromise;
  Promise.config({
    warnings: true,
    longStackTraces: true
  });
} catch (_err) {
  // console.log(_err);
}

Error.stackTraceLimit = Infinity;
