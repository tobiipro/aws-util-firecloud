'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeQuery = exports.queryResultToObjectsArray = exports.pollQueryCompletedState = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _bluebird2 = require('bluebird');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let pollQueryCompletedState = exports.pollQueryCompletedState = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({
    athena,
    QueryExecutionId,
    pollingDelay = 1000
  }) {
    let data = yield athena.getQueryExecution({ QueryExecutionId }).promise();
    let state = data.QueryExecution.Status.State;
    if (state === 'RUNNING' || state === 'QUEUED' || state === 'SUBMITTED') {
      yield (0, _bluebird2.delay)(pollingDelay);

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

    yield (0, _bluebird2.delay)(initPollingDelay);
    let status = yield pollQueryCompletedState({
      athena,
      QueryExecutionId,
      pollingDelay
    });

    if (status !== 'SUCCEEDED') {
      throw Error("Athena: query didn't succeed.");
    }

    let queryResult = yield athena.getQueryResults({ QueryExecutionId }).promise();
    let resultObject = queryResultToObjectsArray(queryResult);
    resultObject = _lodashFirecloud2.default.drop(resultObject, 1); // first row is column names
    return resultObject;
  });

  return function executeQuery(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

exports.default = exports;

//# sourceMappingURL=athena.js.map