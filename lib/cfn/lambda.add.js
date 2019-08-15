"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.add = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _lambda = _interopRequireDefault(require("./lambda.get-code-checksum-variables"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let add = async function ({
  Code,
  Resources,
  cfnDir,
  config,
  env,
  resNs,
  force = false })
{
  let FunctionName =
  _lodashFirecloud.default.replace(config.nameTemplate, '{{.Function.Name}}', config.name);

  // eslint-disable-next-line global-require
  let partialTpl = await (async createError => {try {return await require(cfnDir).default({
        env,
        dir: cfnDir,
        resNs });} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());


  let Lambda = _lodashFirecloud.default.get(partialTpl, 'Resources.Lambda');
  if (Lambda) {
    delete partialTpl.Resources.Lambda;
  } else {
    Lambda = {};
  }

  _lodashFirecloud.default.merge(Lambda, {
    Properties: {
      Environment: {
        Variables: config.environment || {} } } });




  // filter out storage resources
  partialTpl.Resources = _lodashFirecloud.default.pickBy(partialTpl.Resources, function (Resource, _ResourceName) {
    switch (Resource.Type) {
      case 'AWS::DynamoDB::Table':
      case 'AWS::Kinesis::DeliveryStream':
      case 'AWS::Kinesis::Stream':
      case 'AWS::S3::Bucket':
        return false;
      default:
        return true;}

  });

  partialTpl.Resources = _lodashFirecloud.default.mapKeys(partialTpl.Resources, function (_value, key) {
    return `${resNs}${key}`;
  });

  _lodashFirecloud.default.merge(Resources, partialTpl.Resources);

  Resources[`${resNs}LambdaL`] = _lodashFirecloud.default.defaultTo(Resources[`${resNs}LambdaL`], {
    DeletionPolicy: 'Delete',
    Type: 'AWS::Logs::LogGroup',
    Properties: {
      LogGroupName: `/aws/lambda/${FunctionName}`,
      RetentionInDays: 7 } });



  let Role = {
    'Fn::GetAtt': [
    'LambdaR',
    'Arn'] };



  if (Resources[`${resNs}LambdaR`]) {
    Role = {
      'Fn::GetAtt': [
      `${resNs}LambdaR`,
      'Arn'] };


  }

  let Variables = {
    APEX_FUNCTION_NAME: config.name, // apex specific
    LAMBDA_FUNCTION_NAME: FunctionName // apex specific
  };

  let codeChecksumVariables = await (async createError => {try {return await (0, _lambda.default)({
        Code,
        FunctionName,
        env,
        force });} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());

  _lodashFirecloud.default.merge(Variables, codeChecksumVariables);

  Lambda = _lodashFirecloud.default.merge({
    DependsOn: _lodashFirecloud.default.concat([
    `${resNs}LambdaL`],
    _lodashFirecloud.default.get(Lambda, 'DependsOn', [])),
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
        Variables } } },


  Lambda);

  return Lambda;
};exports.add = add;var _default = exports.add;exports.default = _default;

//# sourceMappingURL=lambda.add.js.map