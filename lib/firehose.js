'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.putRecords = exports._putRecordBatches = exports.limits = exports.getLambdaStreamName = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _dynamodb = require('./dynamodb');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let getLambdaStreamName = exports.getLambdaStreamName = _dynamodb.getLambdaTableName;

// see https://docs.aws.amazon.com/firehose/latest/dev/limits.html
let limits = exports.limits = {
  batchByteSize: 4 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1000 * 1024
};

let _putRecordBatches = exports._putRecordBatches = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({ firehose, recordBatches }) {
    if (_lodashFirecloud2.default.isEmpty(recordBatches)) {
      return;
    }

    let recordBatch = recordBatches.pop();
    delete recordBatch.byteSize;
    yield firehose.putRecordBatch(recordBatch).promise();
    yield exports._putRecordBatches(recordBatches);
  });

  return function _putRecordBatches(_x) {
    return _ref.apply(this, arguments);
  };
})();

let putRecords = exports.putRecords = (() => {
  var _ref2 = (0, _bluebird.coroutine)(function* ({
    DeliveryStreamName,
    ctx,
    firehose = new _awsSdk2.default.Firehose(),
    records
  }) {
    let recordBatches = [];
    let recordBatch = {
      DeliveryStreamName,
      Records: [],
      byteSize: 0
    };

    _lodashFirecloud2.default.forEach(records, function (record) {
      let Data = JSON.stringify(record);
      Data = `${Data}\n`;
      let dataLength = Buffer.byteLength(Data);

      if (dataLength > exports.limits.recordByteSize) {
        ctx.log.error(`Skipping record larger than ${exports.limits.recordByteSize / 1024} KB: \
${dataLength / 1024} KB.`, { record });
        return;
      }

      if (recordBatch.byteSize + dataLength > exports.limits.batchByteSize || recordBatch.Records.length + 1 > exports.limits.batchRecord) {
        recordBatches.push(recordBatch);
        recordBatch = {
          DeliveryStreamName,
          Records: [],
          byteSize: 0
        };
      }

      recordBatch.byteSize = recordBatch.byteSize + dataLength;

      recordBatch.Records.push({
        Data
      });
    });

    recordBatches.push(recordBatch);
    _lodashFirecloud2.default.remove(recordBatches, { byteSize: 0 });

    yield exports._putRecordBatches({ firehose, recordBatches });
  });

  return function putRecords(_x2) {
    return _ref2.apply(this, arguments);
  };
})();

exports.default = exports;

//# sourceMappingURL=firehose.js.map