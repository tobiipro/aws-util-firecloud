import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

// see https://docs.aws.amazon.com/firehose/latest/dev/limits.html
export let limits = {
  batchByteSize: 4 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1000 * 1024
};

let _putRecordBatches = async function({
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
  let largeRecords = [];
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
    let dataByteSize = Buffer.byteLength(Data);

    if (dataByteSize > limits.recordByteSize) {
      largeRecords.push(record);
      ctx.log.error(`Skipping record larger than ${limits.recordByteSize / 1024} KB: \
${dataByteSize / 1024} KB.`, {
        record
      });
      toProcessCount = toProcessCount - 1;
      return;
    }

    if (recordBatch.byteSize + dataByteSize > limits.batchByteSize ||
        recordBatch.Records.length + 1 > limits.batchRecord) {
      recordBatches.push(recordBatch);
      recordBatch = {
        DeliveryStreamName,
        Records: [],
        byteSize: 0
      };
    }

    recordBatch.byteSize = recordBatch.byteSize + dataByteSize;

    recordBatch.Records.push({
      Data
    });
  });

  recordBatches.push(recordBatch);
  recordBatches = _.reject(recordBatches, {
    byteSize: 0
  });

  let processedCount = await _putRecordBatches({firehose, recordBatches});
  if (processedCount !== toProcessCount) {
    throw new Error(`Not all records processed. Expected ${toProcessCount}, actually ${processedCount}.`);
  }

  return {
    largeRecords
  };
};

export default exports;
