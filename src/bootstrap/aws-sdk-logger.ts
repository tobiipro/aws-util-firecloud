import aws from 'aws-sdk';
import logger from '../logger';

// TODO missing definition in aws-sdk-js
declare module 'aws-sdk/lib/config' {
  interface Logger {
    isTTY?: boolean;
  }
}

// eslint-disable-next-line no-console
let _stdErrConsole = new console.Console({
  stdout: process.stderr,
  stderr: process.stderr
});

aws.config.logger = {
  isTTY: false,
  log: function(...messages) {
    // ignore the rest, aws-sdk-js only calls with one argument: awsSdkMessage
    logger(messages[0], _stdErrConsole);
    if (messages.length > 1) {
      throw new Error(`aws-sdk-js logger called with ${messages.length} arguments instead of just 1.`);
    }
  }
};
