import aws from 'aws-sdk';
import logger from '../logger';

aws.config.logger = {
  isTTY: false,
  log: logger
};
