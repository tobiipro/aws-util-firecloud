"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.xForwardMethodHeaders = exports.pathPartToResourceName = exports.addNestedApiResources = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let addNestedApiResources = function ({
  ParentId,
  Resources,
  RestApiId,
  location,
  resourceNamePrefix })
{
  let nestedPathParts = function () {
    let slashTrimmedLocation = _lodashFirecloud.default.replace(location, /^\/|\/$/, '');
    return _lodashFirecloud.default.split(slashTrimmedLocation, '/');
  }();
  let suffix = '';
  let resourceName;
  _lodashFirecloud.default.forEach(nestedPathParts, function (nestedPathPart) {
    suffix = `${suffix}${exports.pathPartToResourceName(nestedPathPart)}`;
    resourceName = `${resourceNamePrefix}${suffix}Resource`;

    Resources[resourceName] = {
      Type: 'AWS::ApiGateway::Resource',
      Properties: {
        ParentId,
        PathPart: nestedPathPart,
        RestApiId } };


    ParentId = {
      Ref: resourceName };

  });

  return resourceName;
};exports.addNestedApiResources = addNestedApiResources;

let pathPartToResourceName = function (pathPart) {
  return _lodashFirecloud.default.upperFirst(_lodashFirecloud.default.camelCase(pathPart));
};exports.pathPartToResourceName = pathPartToResourceName;

let xForwardMethodHeaders = function ({
  Method,
  headers })
{
  _lodashFirecloud.default.defaultsDeep(Method, {
    Properties: {
      Integration: {
        RequestParameters: {} },

      RequestParameters: {} } });



  let reqParams = Method.Properties.RequestParameters;
  let integrationReqParams = Method.Properties.Integration.RequestParameters;

  _lodashFirecloud.default.forEach(headers, function (header) {
    let methodReqHeader = `method.request.header.${header}`;
    let integrationReqHeader = `integration.request.header.X-Forward-${header}`;

    reqParams[methodReqHeader] = false;
    integrationReqParams[integrationReqHeader] = methodReqHeader;
  });
};exports.xForwardMethodHeaders = xForwardMethodHeaders;

//# sourceMappingURL=api-gateway.js.map