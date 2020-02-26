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
    Resource.DependsOn = Resource.DependsOn.length > 0 ? Resource.DependsOn : undefined;
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

let build = async function (args) {
  let {
    incs = [],
    partial = false } =



  args;

  // e.g. {env, resNs, vars}
  let incArgs = _lodashFirecloud.default.omit(args, [
  'incs',
  'partial']);


  let tpl = {};

  incs = _lodashFirecloud.default.map(incs, function (inc) {
    if (_lodashFirecloud.default.isFunction(inc)) {
      return inc;
    }

    if (!_lodashFirecloud.default.isString(inc)) {
      throw new Error(`Received inc as '${inc}' but expected a string at this point.`);
    }

    if (!_path.default.isAbsolute(inc)) {
      inc = _path.default.join(process.cwd(), inc);
    }
    let incModule = inc;
    // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
    inc = require(incModule);
    inc = inc.__esModule ? inc.default : inc;

    if (!_lodashFirecloud.default.isFunction(inc)) {
      throw new Error(`Received inc as '${inc}' (from module '${incModule}') but expected a function at this point.`);
    }
    return inc;
  });

  for (let inc of incs) {
    let partialTpls = await (async createError => {try {return await inc(incArgs);} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());

    // allow the main function to return multiple partial templates
    if (!_lodashFirecloud.default.isArray(partialTpls)) {
      partialTpls = [
      partialTpls];

    }

    _lodashFirecloud.default.merge(tpl, ...partialTpls);
  }

  if (!partial) {
    exports._surfaceDependsOn(tpl);
    exports._standardizeSids(tpl);
  }

  return tpl;
};exports.build = build;var _default = exports.build;exports.default = _default;

//# sourceMappingURL=build.js.map