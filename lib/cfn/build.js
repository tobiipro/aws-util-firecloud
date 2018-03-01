'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.build = exports.sortedReaddir = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

require('../bootstrap');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _2 = require('./');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let sortedReaddir = exports.sortedReaddir = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({ dir }) {
    let files = _fs2.default.readdirSync(dir);
    files = _lodashFirecloud2.default.sortBy(files);
    files = _lodashFirecloud2.default.map(files, function (file) {
      return _path2.default.join(dir, file);
    });
    return files;
  });

  return function sortedReaddir(_x) {
    return _ref.apply(this, arguments);
  };
})();

let build = exports.build = (() => {
  var _ref2 = (0, _bluebird.coroutine)(function* ({
    dir,
    env,
    incs = [],
    partial = false,
    resNs
  }) {
    let tpl = {};

    if (!_lodashFirecloud2.default.isUndefined(dir)) {
      if (_fs2.default.existsSync(dir)) {
        let dirIncs = _lodashFirecloud2.default.filter((yield sortedReaddir({ dir })), function (inc) {
          return (/\.cfn\.js$/.test(inc)
          );
        });
        incs = _lodashFirecloud2.default.concat(incs, dirIncs);
      }
    }

    let vars = {};
    if (_fs2.default.existsSync(`${dir}/vars.js`)) {
      // eslint-disable-next-line global-require
      vars = yield require(`${dir}/vars.js`).default({ env, resNs });
    }

    yield Promise.all(_lodashFirecloud2.default.map(incs, (() => {
      var _ref3 = (0, _bluebird.coroutine)(function* (inc) {
        if (!_path2.default.isAbsolute(inc)) {
          inc = _path2.default.join(process.cwd(), inc);
        }
        // eslint-disable-next-line global-require
        let main = require(inc).default;
        let partialTpls = yield main({
          env,
          resNs,
          vars
        });

        // allow the main function to return multiple partial templates
        partialTpls = _lodashFirecloud2.default.isArray(partialTpls) ? partialTpls : [partialTpls];

        _lodashFirecloud2.default.merge(tpl, ...partialTpls);
      });

      return function (_x3) {
        return _ref3.apply(this, arguments);
      };
    })()));

    if (!partial) {
      // CloudFormation behaviour becomes safer (as per AWS support conversations)
      // if you spell out the DependsOn field, rather than rely on CloudFormation
      // to imply that based on Refs and Fn::GetAtt...
      _lodashFirecloud2.default.forEach(_lodashFirecloud2.default.pickBy(tpl.Resources), function (Resource) {
        let deps = _lodashFirecloud2.default.reduce(Resource, _2.reduceToDependsOn, []);
        // keep only dependencies on other resources
        deps = _lodashFirecloud2.default.intersection(deps, _lodashFirecloud2.default.keys(tpl.Resources));
        Resource.DependsOn = _lodashFirecloud2.default.defaultTo(Resource.DependsOn, []);
        Resource.DependsOn = [].concat(Resource.DependsOn).concat(deps);
        Resource.DependsOn = Resource.DependsOn.length ? Resource.DependsOn : undefined;
      });

      // CloudFormation does not have consistent rules for Sids (statement ids)
      _lodashFirecloud2.default.forEach(_lodashFirecloud2.default.pickBy(tpl.Resources), function (Resource) {
        switch (Resource.Type) {
          case 'AWS::IAM::ManagedPolicy':
            _lodashFirecloud2.default.forEach(Resource.Properties.PolicyDocument.Statement, function (Stmt) {
              Stmt.Sid = _lodashFirecloud2.default.camelCase(Stmt.Sid);
            });
            break;
          case 'AWS::KMS::Key':
            _lodashFirecloud2.default.forEach(Resource.Properties.KeyPolicy.Statement, function (Stmt) {
              Stmt.Sid = _lodashFirecloud2.default.camelCase(Stmt.Sid);
            });
            break;
          case 'AWS::S3::BucketPolicy':
            _lodashFirecloud2.default.forEach(Resource.Properties.PolicyDocument.Statement, function (Stmt) {
              Stmt.Sid = _lodashFirecloud2.default.camelCase(Stmt.Sid);
            });
            break;
          default:
        }
      });
    }

    return tpl;
  });

  return function build(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

exports.default = build;

//# sourceMappingURL=build.js.map