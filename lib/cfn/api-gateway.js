'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.xForwardMethodHeaders = exports.pathPartToResourceName = exports.addNestedApiResources = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let addNestedApiResources = exports.addNestedApiResources = function ({
  ParentId,
  Resources,
  RestApiId,
  location,
  resourceNamePrefix
}) {
  let nestedPathParts = function () {
    let slashTrimmedLocation = _lodashFirecloud2.default.replace(location, /^\/|\/$/, '');
    return _lodashFirecloud2.default.split(slashTrimmedLocation, '/');
  }();
  let suffix = '';
  let resourceName;
  _lodashFirecloud2.default.forEach(nestedPathParts, function (nestedPathPart) {
    suffix = `${suffix}${exports.pathPartToResourceName(nestedPathPart)}`;
    resourceName = `${resourceNamePrefix}${suffix}Resource`;

    Resources[resourceName] = {
      Type: 'AWS::ApiGateway::Resource',
      Properties: {
        ParentId,
        PathPart: nestedPathPart,
        RestApiId
      }
    };
    ParentId = { Ref: resourceName };
  });

  return resourceName;
};

let pathPartToResourceName = exports.pathPartToResourceName = function (pathPart) {
  return _lodashFirecloud2.default.upperFirst(_lodashFirecloud2.default.camelCase(pathPart));
};

let xForwardMethodHeaders = exports.xForwardMethodHeaders = function ({
  Method,
  headers
}) {
  _lodashFirecloud2.default.defaultsDeep(Method, {
    Properties: {
      Integration: {
        RequestParameters: {}
      },
      RequestParameters: {}
    }
  });

  let reqParams = Method.Properties.RequestParameters;
  let integrationReqParams = Method.Properties.Integration.RequestParameters;

  _lodashFirecloud2.default.forforE(headers, function (header) {
    let methodReqHeader = `method.request.header.${header}`;
    let integrationReqHeader = `integration.request.header.X-Forward-${header}`;

    reqParams[methodReqHeader] = false;
    integrationReqParams[integrationReqHeader] = methodReqHeader;
  });
};

//# sourceMappingURL=api-gateway.js.map