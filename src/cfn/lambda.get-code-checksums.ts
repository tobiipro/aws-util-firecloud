import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  get as getConfig
} from '../config';

export let getCodeChecksums = async function({
  Code,
  algorithm = 'sha256',
  env
}) {
  let s3 = new aws.S3(getConfig({env}));

  let Bucket = Code.S3Bucket;
  let Key = `${Code.S3Key}.${algorithm}sum`;

  let getObjectResp;
  try {
    getObjectResp = await s3.getObject({
      Bucket,
      Key
    }).promise();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err, {
      Bucket,
      Key
    });
    return [];
  }

  let {
    Body
  } = getObjectResp;
  Body = Body.toString();

  let checksums = {};
  _.forEach(_.split(_.trim(Body), '\n'), function(line) {
    let [
      checksum,
      filename
    ] = _.split(line, '  ');
    checksums[filename] = checksum;
  });

  let filename = _.last(_.split(Code.S3Key, '/'));

  return [
    checksums[`${filename}.info`],
    checksums[`core.${filename}.info`]
  ];
};

export default getCodeChecksums;
