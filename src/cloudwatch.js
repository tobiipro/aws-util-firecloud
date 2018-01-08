import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

export let listAllMetrics = async function({
  cloudwatch = new aws.CloudWatch(),
  iteratee = undefined,
  Token = undefined,
  Metrics = []
} = {}) {
  let {
    Metrics: newMetrics,
    NextToken
  } = await cloudwatch.listMetrics({NextToken: Token}).promise();


  if (_.isFunction(iteratee)) {
    // eslint-disable-next-line callback-return
    await iteratee(newMetrics);
  } else {
    Metrics = Metrics.concat(newMetrics);
  }

  if (!NextToken) {
    return _.isFunction(iteratee) ? undefined : Metrics;
  }

  return exports.listAllMetrics({Token: NextToken, Metrics});
};

export default exports;
