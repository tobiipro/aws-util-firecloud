import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  isIntrinsicFun
} from '.';

import {
  get as getConfig
} from '../config';

export let getLatestNodejsELB = async function({env}) {
  let ec2 = new aws.EC2(getConfig({env}));

  let image = _.last((await ec2.describeImages({
    Filters: [{
      Name: 'name',
      Values: [
        'aws-elasticbeanstalk-amzn-*.x86_64-nodejs-pv-*'
      ]
    }]
  }).promise()).Images);

  return image;
};

export let reduceToOptionSettings = function(acc, options, Namespace) {
  return acc.concat(_.reduce(options, function(acc, Value, OptionName) {
    if (_.isNil(Value)) {
      return acc;
    }
    // Value can only be string
    if (_.isArray(Value)) {
      if (_.filter(Value, isIntrinsicFun).length) {
        Value = Value.join();
      }
    } else if (_.isPlainObject(Value)) {
      if (!isIntrinsicFun(Value)) {
        Value = JSON.stringify(Value);
      }
    } else if (_.isString(Value) || _.isFinite(Value) || _.isBoolean(Value)) {
      Value = Value.toString();
    } else {
      throw new Error(_.replace(`
        Unsupported type for reduceToBeanstalkOptionSettings:
        '${OptionName}' was given ${Value}`, /^ +/gm, ''));
    }
    return acc.concat([{
      Namespace,
      OptionName,
      Value
    }]);
  }, []));
};
