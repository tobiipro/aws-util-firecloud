import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

export let getNameFromArn = _.memoize(function(queueArn) {
  let name = /^arn:aws:sqs:.*:.*:(.*)$/.exec(queueArn)[1];
  return name;
});

export let getUrl = async function({
  queueArn,
  queueName, // optional if queueArn is defined
  sqs = new aws.SQS()
}) {
  if (!_.isUndefined(queueArn)) {
    queueName = getNameFromArn(queueArn);
  }

  let {
    QueueUrl
  } = await sqs.getQueueUrl({QueueName: queueName}).promise();

  return QueueUrl;
};

export default exports;
