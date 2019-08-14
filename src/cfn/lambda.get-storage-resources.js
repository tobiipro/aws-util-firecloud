import _ from 'lodash-firecloud';

export let getStorageResources = async function({
  cfnDir,
  env,
  resNs
}) {
  // eslint-disable-next-line global-require
  let main = require(cfnDir);
  main = main.__esModule ? main.default : main;
  let partialTpl = await main({
    env,
    dir: cfnDir,
    resNs
  });

  // filter storage resources
  partialTpl.Resources = _.pickBy(partialTpl.Resources, function(Resource, _ResourceName) {
    switch (Resource.Type) {
    case 'AWS::DynamoDB::Table':
    case 'AWS::Kinesis::Stream':
    case 'AWS::Kinesis::DeliveryStream':
    case 'AWS::S3::Bucket':
      break;
    default:
      return false;
    }
    return true;
  });

  partialTpl.Resources = _.mapKeys(partialTpl.Resources, function(_value, key) {
    return `${resNs}${key}`;
  });

  return partialTpl.Resources;
};

export default getStorageResources;
