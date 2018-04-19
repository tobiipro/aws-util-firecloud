import _ from 'lodash-firecloud';

export let addNestedApiResources = function({
  ParentId,
  Resources,
  RestApiId,
  location,
  resourceNamePrefix
}) {
  let nestedPathParts = (function() {
    let slashTrimmedLocation = _.replace(location, /^\/|\/$/, '');
    return _.split(slashTrimmedLocation, '/');
  })();
  let suffix = '';
  let resourceName;
  _.forEach(nestedPathParts, function(nestedPathPart) {
    suffix = `${suffix}${pathPartToResourceName(nestedPathPart)}`;
    resourceName = `${resourceNamePrefix}${suffix}Resource`;

    Resources[resourceName] = {
      Type: 'AWS::ApiGateway::Resource',
      Properties: {
        ParentId,
        PathPart: nestedPathPart,
        RestApiId
      }
    };
    ParentId = {Ref: resourceName};
  });

  return resourceName;
};

export let pathPartToResourceName = function(pathPart) {
  return _.upperFirst(_.camelCase(pathPart));
};

export let xForwardMethodHeaders = function({
  Method,
  headers
}) {
  _.defaultsDeep(Method, {
    Properties: {
      Integration: {
        RequestParameters: {}
      },
      RequestParameters: {}
    }
  });

  let reqParams = Method.Properties.RequestParameters;
  let integrationReqParams = Method.Properties.Integration.RequestParameters;

  _.forforE(headers, function(header) {
    let methodReqHeader = `method.request.header.${header}`;
    let integrationReqHeader = `integration.request.header.X-Forward-${header}`;

    reqParams[methodReqHeader] = false;
    integrationReqParams[integrationReqHeader] = methodReqHeader;
  });
};
