import aws from 'aws-sdk';
import logger from '../logger';

// eslint-disable-next-line no-console
let _stdErrConsole = new console.Console({
  stdout: process.stderr,
  stderr: process.stderr
});

aws.config.logger = {
  isTTY: false,
  log: function(awsSdkMessage) {
    return logger(awsSdkMessage, _stdErrConsole);
  }
};
