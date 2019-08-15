"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.getStorageResources = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let getStorageResources = async function ({
  cfnDir,
  env,
  resNs })
{
  // eslint-disable-next-line global-require
  let main = require(cfnDir);
  main = main.__esModule ? main.default : main;
  let partialTpl = await (async createError => {try {return await main({
        env,
        dir: cfnDir,
        resNs });} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());


  // filter storage resources
  partialTpl.Resources = _lodashFirecloud.default.pickBy(partialTpl.Resources, function (Resource, _ResourceName) {
    switch (Resource.Type) {
      case 'AWS::DynamoDB::Table':
      case 'AWS::Kinesis::Stream':
      case 'AWS::Kinesis::DeliveryStream':
      case 'AWS::S3::Bucket':
        break;
      default:
        return false;}

    return true;
  });

  partialTpl.Resources = _lodashFirecloud.default.mapKeys(partialTpl.Resources, function (_value, key) {
    return `${resNs}${key}`;
  });

  return partialTpl.Resources;
};exports.getStorageResources = getStorageResources;var _default = exports.getStorageResources;exports.default = _default;

//# sourceMappingURL=lambda.get-storage-resources.js.map