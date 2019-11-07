// eslint-disable-next-line import/no-unassigned-import
import '../bootstrap';

import _ from 'lodash-firecloud';
import path from 'path';

import {
  reduceToDependsOn
} from '.';

let _surfaceDependsOn = function(tpl) {
  // CloudFormation behaviour becomes safer (as per AWS support conversations)
  // if you spell out the DependsOn field, rather than rely on CloudFormation
  // to imply that based on Refs and Fn::GetAtt...
  _.forEach(_.pickBy(tpl.Resources), function(Resource) {
    let deps = _.reduce(Resource, reduceToDependsOn, []);
    // keep only dependencies on other resources
    deps = _.intersection(deps, _.keys(tpl.Resources));
    Resource.DependsOn = _.defaultTo(Resource.DependsOn, []);
    Resource.DependsOn = [].concat(Resource.DependsOn).concat(deps);
    Resource.DependsOn = Resource.DependsOn.length ? Resource.DependsOn : undefined;
  });
};

let _standardizeSids = function(tpl) {
  // CloudFormation does not have consistent rules for Sids (statement ids)
  _.forEach(_.pickBy(tpl.Resources), function(Resource) {
    switch (Resource.Type) {
    case 'AWS::IAM::ManagedPolicy':
    case 'AWS::S3::BucketPolicy':
    case 'AWS::SNS::TopicPolicy':
      _.forEach(Resource.Properties.PolicyDocument.Statement, function(Stmt) {
        Stmt.Sid = _.camelCase(Stmt.Sid);
      });
      break;
    case 'AWS::KMS::Key':
      _.forEach(Resource.Properties.KeyPolicy.Statement, function(Stmt) {
        Stmt.Sid = _.camelCase(Stmt.Sid);
      });
      break;
    default:
    }
  });
};

export let build = async function(args) {
  let {
    incs = [],
    partial = false
  } = args;

  // e.g. {env, resNs, vars}
  let incArgs = _.omit(args, [
    'incs',
    'partial'
  ]);

  let tpl = {};

  incs = _.map(incs, function(inc) {
    if (_.isFunction(inc)) {
      return inc;
    }

    if (!_.isString(inc)) {
      throw new Error(`Received inc as '${inc}' but expected a string at this point.`);
    }

    if (!path.isAbsolute(inc)) {
      inc = path.join(process.cwd(), inc);
    }
    let incModule = inc;
    // eslint-disable-next-line global-require
    inc = require(incModule);
    inc = inc.__esModule ? inc.default : inc;

    if (!_.isFunction(inc)) {
      throw new Error(`Received inc as '${inc}' (from module '${incModule}') but expected a function at this point.`);
    }
    return inc;
  });

  for (let inc of incs) {
    let partialTpls = await inc(incArgs);

    // allow the main function to return multiple partial templates
    if (!_.isArray(partialTpls)) {
      partialTpls = [
        partialTpls
      ];
    }

    _.merge(tpl, ...partialTpls);
  }

  if (!partial) {
    _surfaceDependsOn(tpl);
    _standardizeSids(tpl);
  }

  return tpl;
};

export default build;
