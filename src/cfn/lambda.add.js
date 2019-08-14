import _ from 'lodash-firecloud';
import getCodeChecksumVariables from './lambda.get-code-checksum-variables';

export let add = async function({
  Code,
  Resources,
  cfnDir,
  config,
  env,
  resNs,
  force = false
}) {
  let FunctionName =
      _.replace(config.nameTemplate, '{{.Function.Name}}', config.name);

  // eslint-disable-next-line global-require
  let partialTpl = await require(cfnDir).default({
    env,
    dir: cfnDir,
    resNs
  });

  let Lambda = _.get(partialTpl, 'Resources.Lambda');
  if (Lambda) {
    delete partialTpl.Resources.Lambda;
  } else {
    Lambda = {};
  }

  _.merge(Lambda, {
    Properties: {
      Environment: {
        Variables: config.environment || {}
      }
    }
  });

  // filter out storage resources
  partialTpl.Resources = _.pickBy(partialTpl.Resources, function(Resource, _ResourceName) {
    switch (Resource.Type) {
    case 'AWS::DynamoDB::Table':
    case 'AWS::Kinesis::DeliveryStream':
    case 'AWS::Kinesis::Stream':
    case 'AWS::S3::Bucket':
      return false;
    default:
      return true;
    }
  });

  partialTpl.Resources = _.mapKeys(partialTpl.Resources, function(_value, key) {
    return `${resNs}${key}`;
  });

  _.merge(Resources, partialTpl.Resources);

  Resources[`${resNs}LambdaL`] = _.defaultTo(Resources[`${resNs}LambdaL`], {
    DeletionPolicy: 'Delete',
    Type: 'AWS::Logs::LogGroup',
    Properties: {
      LogGroupName: `/aws/lambda/${FunctionName}`,
      RetentionInDays: 7
    }
  });

  let Role = {
    'Fn::GetAtt': [
      'LambdaR',
      'Arn'
    ]
  };

  if (Resources[`${resNs}LambdaR`]) {
    Role = {
      'Fn::GetAtt': [
        `${resNs}LambdaR`,
        'Arn'
      ]
    };
  }

  let Variables = {
    APEX_FUNCTION_NAME: config.name, // apex specific
    LAMBDA_FUNCTION_NAME: FunctionName // apex specific
  };

  let codeChecksumVariables = await getCodeChecksumVariables({
    Code,
    FunctionName,
    env,
    force
  });
  _.merge(Variables, codeChecksumVariables);

  Lambda = _.merge({
    DependsOn: _.concat([
      `${resNs}LambdaL`
    ], _.get(Lambda, 'DependsOn', [])),
    Type: 'AWS::Lambda::Function',
    Properties: {
      Code,
      Description: config.description,
      FunctionName,
      Handler: config.handler,
      MemorySize: config.memory,
      Timeout: config.timeout,
      Role, // config.role,
      Runtime: config.runtime,
      Environment: {
        Variables
      }
    }
  }, Lambda);

  return Lambda;
};

export default add;
