"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.build = exports._standardizeSids = exports._surfaceDependsOn = void 0;
require("../bootstrap");

var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _path = _interopRequireDefault(require("path"));

var _2 = require(".");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} // eslint-disable-next-line import/no-unassigned-import



let _surfaceDependsOn = function (tpl) {
  // CloudFormation behaviour becomes safer (as per AWS support conversations)
  // if you spell out the DependsOn field, rather than rely on CloudFormation
  // to imply that based on Refs and Fn::GetAtt...
  _lodashFirecloud.default.forEach(_lodashFirecloud.default.pickBy(tpl.Resources), function (Resource) {
    let deps = _lodashFirecloud.default.reduce(Resource, _2.reduceToDependsOn, []);
    // keep only dependencies on other resources
    deps = _lodashFirecloud.default.intersection(deps, _lodashFirecloud.default.keys(tpl.Resources));
    Resource.DependsOn = _lodashFirecloud.default.defaultTo(Resource.DependsOn, []);
    Resource.DependsOn = [].concat(Resource.DependsOn).concat(deps);
    Resource.DependsOn = Resource.DependsOn.length ? Resource.DependsOn : undefined;
  });
};exports._surfaceDependsOn = _surfaceDependsOn;

let _standardizeSids = function (tpl) {
  // CloudFormation does not have consistent rules for Sids (statement ids)
  _lodashFirecloud.default.forEach(_lodashFirecloud.default.pickBy(tpl.Resources), function (Resource) {
    switch (Resource.Type) {
      case 'AWS::IAM::ManagedPolicy':
      case 'AWS::S3::BucketPolicy':
      case 'AWS::SNS::TopicPolicy':
        _lodashFirecloud.default.forEach(Resource.Properties.PolicyDocument.Statement, function (Stmt) {
          Stmt.Sid = _lodashFirecloud.default.camelCase(Stmt.Sid);
        });
        break;
      case 'AWS::KMS::Key':
        _lodashFirecloud.default.forEach(Resource.Properties.KeyPolicy.Statement, function (Stmt) {
          Stmt.Sid = _lodashFirecloud.default.camelCase(Stmt.Sid);
        });
        break;
      default:}

  });
};exports._standardizeSids = _standardizeSids;

let build = async function ({
  env,
  incs = [],
  partial = false,
  resNs, // used by partial cfns, like lambda cfns
  vars })
{
  let tpl = {};

  await (async createError => {try {return await Promise.all(_lodashFirecloud.default.map(incs, async function (inc) {
        if (!_path.default.isAbsolute(inc)) {
          inc = _path.default.join(process.cwd(), inc);
        }
        // eslint-disable-next-line global-require
        let main = require(inc).default;
        let partialTpls = await (async createError => {try {return await main({
              env,
              resNs,
              vars });} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());


        // allow the main function to return multiple partial templates
        partialTpls = _lodashFirecloud.default.isArray(partialTpls) ? partialTpls : [
        partialTpls];


        _lodashFirecloud.default.merge(tpl, ...partialTpls);
      }));} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());

  if (!partial) {
    exports._surfaceDependsOn(tpl);
    exports._standardizeSids(tpl);
  }

  return tpl;
};exports.build = build;var _default = exports.build;exports.default = _default;

//# sourceMappingURL=build.js.map