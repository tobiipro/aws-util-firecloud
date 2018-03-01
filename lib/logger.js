'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
let awsLoggerRE = / *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(([^)]+)\).*/;

let logger = exports.logger = function (message) {
  let [serviceIdentifier, status, delta, retryCount, operation, params] = awsLoggerRE.exec(message).slice(1);
  params = eval(`(${params})`); // eslint-disable-line no-eval

  // eslint-disable-next-line no-console
  console.error('Making an AWS SDK call.');
  // eslint-disable-next-line no-console
  console.error({
    aws: {
      serviceIdentifier,
      status,
      delta,
      retryCount,
      operation,
      params
    }
  });
};

exports.default = logger;

//# sourceMappingURL=logger.js.map