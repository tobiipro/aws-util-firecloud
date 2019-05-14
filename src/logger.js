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
