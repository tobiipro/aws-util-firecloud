import _ from 'lodash-firecloud';

let _awsLoggerRE =
  / *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(([^)]+)\).*/;

let _logger = function(awsSdkMessage, rawLogger) {
  let [
    serviceIdentifier,
    status,
    delta,
    retryCount,
    operation,
    params
  ] = _awsLoggerRE.exec(awsSdkMessage).slice(1);

  try {
    // 'params' is essentially an output of util.format('%o', realParams)
    // remove the hidden property 'length' of arrays, so we can eval params back into realParams
    let paramsWithoutArrayLength = _.replace(params, /,?\s+\[length\]:\s+\d+(\s+\])/g, '$1');
    // eslint-disable-next-line no-eval
    params = eval(`(${paramsWithoutArrayLength})`);
  } catch (err) {
    rawLogger.error("Couldn't eval 'params' of AWS SDK call.", {
      err,
      awsSdkMessage,
      params
    });
  }

  // eslint-disable-next-line no-eval
  params = eval(`(${params})`);

  rawLogger.error('Making an AWS SDK call.');
  rawLogger.error({
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

export let logger = function(awsSdkMessage, rawLogger = console) {
  try {
    _logger(awsSdkMessage, rawLogger);
  } catch (err) {
    rawLogger.error('Failed while tracing AWS SDK call.', {
      err,
      awsSdkMessage
    });
  }
};

export default logger;
