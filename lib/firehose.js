'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.putRecords = exports._putRecordBatches = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

      if (dataLength > 1000 * 1024) {
        // 1000 KB (not 1 MB) hard limit in Firehose http://docs.aws.amazon.com/firehose/latest/dev/limits.html
        ctx.log.error(`Skipping record larger than 1000 KB: ${dataLength / 1024} KB.`, { record });
        return;
      }

      // PutRecordBatch has a 4 MB limit and 500 records
      if (recordBatch.byteSize + dataLength > 4 * 1024 * 1024 || recordBatch.Records.length + 1 > 500) {
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