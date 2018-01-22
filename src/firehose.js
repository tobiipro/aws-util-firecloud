import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

// see https://docs.aws.amazon.com/firehose/latest/dev/limits.html
export let limits = {
  batchByteSize: 4 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1000 * 1024
};

export let _putRecordBatches = async function({firehose, recordBatches}) {
  if (_.isEmpty(recordBatches)) {
    return;
  }

  let recordBatch = recordBatches.pop();
  delete recordBatch.byteSize;
  await firehose.putRecordBatch(recordBatch).promise();
  await exports._putRecordBatches(recordBatches);
};

export let putRecords = async function({
  DeliveryStreamName,
  ctx,
  firehose = new aws.Firehose(),
  records
}) {
  let recordBatches = [];
  let recordBatch = {
    DeliveryStreamName,
    Records: [],
    byteSize: 0
  };

  _.forEach(records, function(record) {
    let Data = JSON.stringify(record);
    Data = `${Data}\n`;
    let dataLength = Buffer.byteLength(Data);

    if (dataLength > exports.limits.recordByteSize) {
      ctx.log.error(`Skipping record larger than ${exports.limits.recordByteSize / 1024} KB: \
${dataLength / 1024} KB.`, {record});
      return;
    }

    if (recordBatch.byteSize + dataLength > exports.limits.batchByteSize ||
        recordBatch.Records.length + 1 > exports.limits.batchRecord) {
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
  _.remove(recordBatches, {byteSize: 0});

  await exports._putRecordBatches({firehose, recordBatches});
};

export default exports;
