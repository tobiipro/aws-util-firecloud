'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeQuery = exports.queryResultToObjectsArray = exports.pollQueryCompletedState = exports.getOutputBucketName = exports.getDatabaseName = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _region = require('./region');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let getDatabaseName = exports.getDatabaseName = function ({
  region,
  env
}) {
  region = _lodashFirecloud2.default.defaultTo(region, (0, _region.get)({ env }));

  let name = `${env.ENV_NAME}-${env.PROJECT_DOMAIN_NAME}-${region}`;
  name = _lodashFirecloud2.default.toLower(name);
  name = _lodashFirecloud2.default.replace(name, /[^a-z0-9-]/g, '_');
  name = _lodashFirecloud2.default.replace(name, /-+/g, '_');

  return name;
};

let getOutputBucketName = exports.getOutputBucketName = function ({
  region,
  env
}) {
  region = _lodashFirecloud2.default.defaultTo(region, (0, _region.get)({ env }));

  let name = `aws-athena-query-results-${env.AWS_ACCOUNT_ID}-${region}`;

  return name;
};

let pollQueryCompletedState = exports.pollQueryCompletedState = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({
    athena,
    QueryExecutionId,
    pollingDelay = 1000
  }) {
    let data = yield athena.getQueryExecution({ QueryExecutionId }).promise();
    let state = data.QueryExecution.Status.State;
    if (state === 'RUNNING' || state === 'QUEUED' || state === 'SUBMITTED') {
      yield _lodashFirecloud2.default.sleep(pollingDelay);

      // eslint-disable-next-line fp/no-arguments
      return yield pollQueryCompletedState(...arguments);
    }

    return state;
  });

  return function pollQueryCompletedState(_x) {
    return _ref.apply(this, arguments);
  };
})();

let queryResultToObjectsArray = exports.queryResultToObjectsArray = function (queryResult) {
  let columnInfo = queryResult.ResultSet.ResultSetMetadata.ColumnInfo;
  let columns = _lodashFirecloud2.default.map(columnInfo, function (column) {
    return _lodashFirecloud2.default.pick(column, ['Name', 'Type']);
  });

  let rows = queryResult.ResultSet.Rows;
  let rowsObjects = _lodashFirecloud2.default.map(rows, function (row) {
    let rowObject = {};

    _lodashFirecloud2.default.forEach(columns, function (column, columnIndex) {
      let value = row.Data[columnIndex].VarCharValue;

      if (!_lodashFirecloud2.default.isUndefined(value)) {
        switch (_lodashFirecloud2.default.toLower(column.Type)) {
          case 'integer':
          case 'tinyint':
          case 'smallint':
          case 'bigint':
          case 'double':
            value = Number(value);
            break;
          case 'boolean':
            value = Boolean(value);
            break;
          default:
            break;
        }
      }

      rowObject[column.Name] = value;
    });

    return rowObject;
  });

  return rowsObjects;
};

let executeQuery = exports.executeQuery = (() => {
  var _ref2 = (0, _bluebird.coroutine)(function* ({
    athena = new _awsSdk2.default.Athena({ apiVersion: '2017-05-18' }),
    params = {
      QueryString: '',
      ResultConfiguration: {
        OutputLocation: 's3://aws-athena-query-results-094611745175-eu-west-1/'
      }
    },
    pollingDelay = 1000,
    initPollingDelay = pollingDelay
  }) {
    let queryExecutionData = yield athena.startQueryExecution(params).promise();
    let { QueryExecutionId } = queryExecutionData;

    yield _lodashFirecloud2.default.sleep(initPollingDelay);
    let status = yield exports.pollQueryCompletedState({
      athena,
      QueryExecutionId,
      pollingDelay
    });

    if (status !== 'SUCCEEDED') {
      throw Error("Athena: query didn't succeed.");
    }

    let queryResult = yield athena.getQueryResults({ QueryExecutionId }).promise();
    let resultObject = exports.queryResultToObjectsArray(queryResult);
    resultObject = _lodashFirecloud2.default.drop(resultObject, 1); // first row is column names
    return resultObject;
  });

  return function executeQuery(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

exports.default = exports;

//# sourceMappingURL=athena.js.map