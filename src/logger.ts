import _ from 'lodash-firecloud';

import {
  MinLog
} from 'minlog';

let _awsLoggerRE =
  / *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(([^)]+)\).*/;

let _logger = function(awsSdkMessage, rawLogger: Console | MinLog): void {
  let [
    _ignore,
    serviceIdentifier,
    status,
    delta,
    retryCount,
    operation,
    params
  ] = _.defaultTo(_awsLoggerRE.exec(awsSdkMessage), []);

  try {
    // 'params' is essentially an output of util.format('%o', realParams)
    // remove the hidden property 'length' of arrays, so we can eval params back into realParams
    let paramsWithoutArrayLength = _.replace(params, /,?\s+\[length\]:\s+\d+(\s+\])/g, '$1');
    // eslint-disable-next-line no-eval
    params = eval(`(${paramsWithoutArrayLength})`);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    rawLogger.warn("Couldn't eval 'params' of AWS SDK call.", {
      err,
      awsSdkMessage,
      params
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  rawLogger.info('Making an AWS SDK call.', {
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

export let logger = function(awsSdkMessage, rawLogger: Console | MinLog = console): void {
  try {
    _logger(awsSdkMessage, rawLogger);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    rawLogger.error('Failed while tracing AWS SDK call.', {
      err,
      awsSdkMessage
    });
  }
};

export default logger;
