'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dcPut = exports.dcScan = exports.scanWithBackticks = exports.getDefaultTotalSegments = exports.getLambdaTableName = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let getLambdaTableName = exports.getLambdaTableName = function ({
  pkg,
  suffix = '',
  env
}) {
  if (suffix) {
    suffix = `-${suffix}`;
  }

  return `${env.ENV_NAME}-Lambda-${pkg.name}${suffix}`;
};

let getDefaultTotalSegments = exports.getDefaultTotalSegments = (() => {
  var _ref = (0, _bluebird.coroutine)(function* (TableName) {
    let db = new _awsSdk2.default.DynamoDB();
    let { Table } = yield db.describeTable({ TableName }).promise();

    let TwoGigabytesInBytes = 2 * 1024 * 1024 * 1024;
    return Math.floor(Table.TableSizeBytes / TwoGigabytesInBytes) + 1;
  });

  return function getDefaultTotalSegments(_x) {
    return _ref.apply(this, arguments);
  };
})();

let scanWithBackticks = exports.scanWithBackticks = function (args) {
  if (!args.FilterExpression) {
    return args;
  }

  args.ExpressionAttributeNames = _lodashFirecloud2.default.defaultTo(args.ExpressionAttributeNames, {});
  args.FilterExpression = _lodashFirecloud2.default.replace(args.FilterExpression, /`([^`]+)`/g, function (_match, attrs) {
    attrs = _lodashFirecloud2.default.split(attrs, '.');
    attrs = _lodashFirecloud2.default.map(attrs, function (attr) {
      attr = _lodashFirecloud2.default.replace(attr, /^#/, '');
      let safeAttr = _lodashFirecloud2.default.replace(attr, /[^A-Za-z0-9]/g, '_');
      safeAttr = `#${safeAttr}`;
      // FIXME should I even bother checking if this is a reserved word
      args.ExpressionAttributeNames[safeAttr] = attr;
      return safeAttr;
    });
    attrs = attrs.join('.');
    return attrs;
  });
  return args;
};

let dcScan = exports.dcScan = (() => {
  var _ref2 = (0, _bluebird.coroutine)(function* (args, iteratee) {
    let dc = new _awsSdk2.default.DynamoDB.DocumentClient();

    args = exports.scanWithBackticks(args);
    // NOTE: we disable parallel scanning for now
    // until we reach >2GB dynamodb tables
    // args.TotalSegments =
    //   _.defaultTo(args.TotalSegments,
    //   await exports.getDefaultTotalSegments(args.TableName));
    args.TotalSegments = 1;
    args.TotalSegments = _lodashFirecloud2.default.max([1, args.TotalSegments]);

    if (args.Limit) {
      args.Limit = _lodashFirecloud2.default.ceil(args.Limit / args.TotalSegments);
    }

    let continueScan = true;
    let results = [];
    let limit;

    let scan = (() => {
      var _ref3 = (0, _bluebird.coroutine)(function* () {
        yield Promise.all(_lodashFirecloud2.default.map(_lodashFirecloud2.default.range(0, args.TotalSegments), (() => {
          var _ref4 = (0, _bluebird.coroutine)(function* (Segment) {
            let iteratorArgs = _lodashFirecloud2.default.cloneDeep(args);
            iteratorArgs.Segment = Segment;

            if (results[Segment]) {
              iteratorArgs.ExclusiveStartKey = results[Segment].LastEvaluatedKey;
            }
            results[Segment] = yield dc.scan(iteratorArgs).promise();
          });

          return function (_x4) {
            return _ref4.apply(this, arguments);
          };
        })()));

        _lodashFirecloud2.default.forEach(results, function (result) {
          // eslint-disable-line no-loop-func
          let cbResult = _lodashFirecloud2.default.defaultTo(iteratee(result), true);

          if (_lodashFirecloud2.default.isBoolean(cbResult)) {
            cbResult = {
              continueScan: cbResult
            };
          }

          limit = _lodashFirecloud2.default.get(cbResult, 'args.Limit');
          continueScan = cbResult.continueScan !== false && !_lodashFirecloud2.default.isUndefined(result.LastEvaluatedKey);

          return continueScan;
        });

        if (!continueScan) {
          return;
        }

        if (limit) {
          args.Limit = _lodashFirecloud2.default.ceil(limit / args.TotalSegments);
        }

        yield scan();
      });

      return function scan() {
        return _ref3.apply(this, arguments);
      };
    })();

    yield scan();
  });

  return function dcScan(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
})();

let dcPut = exports.dcPut = (() => {
  var _ref5 = (0, _bluebird.coroutine)(function* (args) {
    let dc = new _awsSdk2.default.DynamoDB.DocumentClient();

    args.Item = _lodashFirecloud2.default.deeply(_lodashFirecloud2.default.pickBy)(args.Item, function (value) {
      return !_lodashFirecloud2.default.isUndefined(value) && value !== '';
    });

    return yield dc.put(args).promise();
  });

  return function dcPut(_x5) {
    return _ref5.apply(this, arguments);
  };
})();

exports.default = exports;

//# sourceMappingURL=dynamodb.js.map