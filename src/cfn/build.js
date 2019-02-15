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

export let build = async function({
  env,
  incs = [],
  partial = false,
  resNs, // used by partial cfns, like lambda cfns
  vars
}) {
  let tpl = {};

  await Promise.all(_.map(incs, async function(inc) {
    if (!path.isAbsolute(inc)) {
      inc = path.join(process.cwd(), inc);
    }
    // eslint-disable-next-line global-require
    let main = require(inc).default;
    let partialTpls = await main({
      env,
      resNs,
      vars
    });

    // allow the main function to return multiple partial templates
    partialTpls = _.isArray(partialTpls) ? partialTpls : [
      partialTpls
    ];

    _.merge(tpl, ...partialTpls);
  }));

  if (!partial) {
    _surfaceDependsOn(tpl);
    _standardizeSids(tpl);
  }

  return tpl;
};

export default build;
