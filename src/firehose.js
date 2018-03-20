import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  getLambdaTableName
} from './dynamodb';

export let getLambdaStreamName = getLambdaTableName;

// see https://docs.aws.amazon.com/firehose/latest/dev/limits.html
export let limits = {
  batchByteSize: 4 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1000 * 1024
};

export let _putRecordBatches = async function({
  firehose,
  recordBatches
}) {
  let processedCount = 0;

  // eslint-disable-next-line fp/no-loops, better/no-fors
  for (let recordBatch of recordBatches) {
    delete recordBatch.byteSize;
    await firehose.putRecordBatch(recordBatch).promise();
    processedCount = processedCount + recordBatch.Records.length;
  }

  return processedCount;
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

  let toProcessCount = records.length;

  _.forEach(records, function(record) {
    let Data = JSON.stringify(record);
    Data = `${Data}\n`;
    let dataLength = Buffer.byteLength(Data);

    if (dataLength > exports.limits.recordByteSize) {
      ctx.log.error(`Skipping record larger than ${exports.limits.recordByteSize / 1024} KB: \
${dataLength / 1024} KB.`, {record});
      toProcessCount = toProcessCount - 1;
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

  let processedRecords = await exports._putRecordBatches({firehose, recordBatches});
  if (processedRecords !== toProcessCount) {
    throw new Error(`Not all records processed. Expected ${toProcessCount}, actually ${processedRecords}`);
  }
};

export default exports;
