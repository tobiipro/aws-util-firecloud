let awsLoggerRE =
  / *\[AWS ([^ ]+) ([^ ]+) ([^ ]+)s ([^ ]+) retries] ([^(]+)\(([^)]+)\).*/;

export let logger = function(message) {
  let [
    serviceIdentifier,
    status,
    delta,
    retryCount,
    operation,
    params
  ] = awsLoggerRE.exec(message).slice(1);
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

export default logger;