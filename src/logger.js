import _ from 'lodash-firecloud';

let _awsLoggerRE =
  / *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(([^)]+)\).*/;

export let logger = function(message) {
  let [
    serviceIdentifier,
    status,
    delta,
    retryCount,
    operation,
    params
  ] = _awsLoggerRE.exec(message).slice(1);

  try {
    // 'params' is essentially an output of util.format('%o', realParams)
    // remove the hidden property 'length' of arrays, so we can eval params back into realParams
    let paramsWithoutArrayLength = _.replace(params, /,?\s+\[length\]:\s+\d+(\s+\])/g, '$1');
    // eslint-disable-next-line no-eval
    params = eval(`(${paramsWithoutArrayLength})`);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Couldn't eval 'params' of AWS SDK call.", {
      err,
      message,
      params
    });
  }

  // eslint-disable-next-line no-eval
  params = eval(`(${params})`);

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

export default logger;
