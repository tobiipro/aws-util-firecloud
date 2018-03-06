'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.executeQuery = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _bluebird2 = require('bluebird');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let _pollQueryCompletedState = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({
    QueryExecutionId,
    getQueryExecutionAsync,
    pollingDelay
  }) {
    let data = yield getQueryExecutionAsync({ QueryExecutionId });
    let state = data.QueryExecution.Status.State;
    if (state === 'RUNNING' || state === 'QUEUED') {
      yield (0, _bluebird2.delay)(pollingDelay);

      // eslint-disable-next-line fp/no-arguments
      return yield _pollQueryCompletedState(...arguments);
    }

    return state;
  });

  return function _pollQueryCompletedState(_x) {
    return _ref.apply(this, arguments);
  };
})();

let _queryResultToObject = function (queryResult) {
  let columnsNames = [];
  _lodashFirecloud2.default.forEach(queryResult.ResultSet.Rows[0].Data, function (value, index) {
    columnsNames[index] = value.VarCharValue;
  });

  let rows = _lodashFirecloud2.default.drop(queryResult.ResultSet.Rows, 1);
  let rowsObjects = _lodashFirecloud2.default.map(rows, function (row) {
    let rowObject = {};

    _lodashFirecloud2.default.forEach(columnsNames, function (columnName, columnIndex) {
      rowObject[columnName] = row.Data[columnIndex].VarCharValue;
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
    let startQueryExecutionAsync = (0, _bluebird2.promisify)(athena.startQueryExecution, { context: athena });
    let getQueryExecutionAsync = (0, _bluebird2.promisify)(athena.getQueryExecution, { context: athena });
    let getQueryResultsAsync = (0, _bluebird2.promisify)(athena.getQueryResults, { context: athena });

    let queryExecutionData = yield startQueryExecutionAsync(params);
    let { QueryExecutionId } = queryExecutionData;

    yield (0, _bluebird2.delay)(initPollingDelay);
    let status = yield _pollQueryCompletedState({
      QueryExecutionId,
      getQueryExecutionAsync,
      pollingDelay
    });

    if (status !== 'SUCCEEDED') {
      throw Error("Athena: query didn't succeed.");
    }

    let queryResult = yield getQueryResultsAsync({ QueryExecutionId });
    let resultObject = _queryResultToObject(queryResult);
    return resultObject;
  });

  return function executeQuery(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

exports.default = exports;

//# sourceMappingURL=athena.js.map