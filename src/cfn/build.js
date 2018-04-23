import '../bootstrap';

import _ from 'lodash-firecloud';
import fs from 'fs';
import path from 'path';

import {
  reduceToDependsOn
} from '.';

export let sortedReaddir = async function({dir}) {
  let files = fs.readdirSync(dir);
  files = _.sortBy(files);
  files = _.map(files, function(file) {
    return path.join(dir, file);
  });
  return files;
};

export let build = async function({
  dir,
  env,
  incs = [],
  partial = false,
  resNs
}) {
  let tpl = {};

  if (!_.isUndefined(dir)) {
    if (fs.existsSync(dir)) {
      let dirIncs = _.filter(await sortedReaddir({dir}), function(inc) {
        return /\.cfn\.js$/.test(inc);
      });
      incs = _.concat(incs, dirIncs);
    }
  }

  if (!partial) {
    incs.unshift('./tpl/core.cfn.js');
  }

  let vars = {};
  if (fs.existsSync(`${dir}/vars.js`)) {
    // eslint-disable-next-line global-require
    vars = await require(`${dir}/vars.js`).default({env, resNs});
  }

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
    partialTpls = _.isArray(partialTpls) ? partialTpls : [partialTpls];

    _.merge(tpl, ...partialTpls);
  }));

  if (!partial) {
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
  }

  return tpl;
};

export default build;
