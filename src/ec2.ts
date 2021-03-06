import _ from 'lodash-firecloud';

import {
  ValueOf
} from './types';

export let awsInstanceTypeToArch = {
  't1.micro': 'PV64',
  't2.nano': 'HVM64',
  't2.micro': 'HVM64',
  't2.small': 'HVM64',
  't2.medium': 'HVM64',
  't2.large': 'HVM64',
  'm1.small': 'PV64',
  'm1.medium': 'PV64',
  'm1.large': 'PV64',
  'm1.xlarge': 'PV64',
  'm2.xlarge': 'PV64',
  'm2.2xlarge': 'PV64',
  'm2.4xlarge': 'PV64',
  'm3.medium': 'HVM64',
  'm3.large': 'HVM64',
  'm3.xlarge': 'HVM64',
  'm3.2xlarge': 'HVM64',
  'm4.large': 'HVM64',
  'm4.xlarge': 'HVM64',
  'm4.2xlarge': 'HVM64',
  'm4.4xlarge': 'HVM64',
  'm4.10xlarge': 'HVM64',
  'c1.medium': 'PV64',
  'c1.xlarge': 'PV64',
  'c3.large': 'HVM64',
  'c3.xlarge': 'HVM64',
  'c3.2xlarge': 'HVM64',
  'c3.4xlarge': 'HVM64',
  'c3.8xlarge': 'HVM64',
  'c4.large': 'HVM64',
  'c4.xlarge': 'HVM64',
  'c4.2xlarge': 'HVM64',
  'c4.4xlarge': 'HVM64',
  'c4.8xlarge': 'HVM64',
  'g2.2xlarge': 'HVMG2',
  'g2.8xlarge': 'HVMG2',
  'r3.large': 'HVM64',
  'r3.xlarge': 'HVM64',
  'r3.2xlarge': 'HVM64',
  'r3.4xlarge': 'HVM64',
  'r3.8xlarge': 'HVM64',
  'i2.xlarge': 'HVM64',
  'i2.2xlarge': 'HVM64',
  'i2.4xlarge': 'HVM64',
  'i2.8xlarge': 'HVM64',
  'd2.xlarge': 'HVM64',
  'd2.2xlarge': 'HVM64',
  'd2.4xlarge': 'HVM64',
  'd2.8xlarge': 'HVM64',
  'hi1.4xlarge': 'HVM64',
  'hs1.8xlarge': 'HVM64',
  'cr1.8xlarge': 'HVM64',
  'cc2.8xlarge': 'HVM64'
} as const;

export let getInstanceTypeToArch = function({instanceType}: {
  instanceType: keyof typeof awsInstanceTypeToArch;
}): ValueOf<typeof awsInstanceTypeToArch> {
  if (!_.has(awsInstanceTypeToArch, instanceType)) {
    throw new Error(`Unknown instance type ${instanceType}.`);
  }

  return awsInstanceTypeToArch[instanceType];
};
