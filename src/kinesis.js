import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

// see https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecords.html
export let limits = {
  batchByteSize: 5 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1024 * 1024
};

let _putRecordBatches = async function({
  kinesis,
  recordBatches
}) {
  let processedCount = 0;

  // eslint-disable-next-line fp/no-loops, better/no-fors
  for (let recordBatch of recordBatches) {
    delete recordBatch.byteSize;
    await kinesis.putRecordBatch(recordBatch).promise();
    processedCount = processedCount + recordBatch.Records.length;
  }

  return processedCount;
};

export let putRecords = async function({
  ExplicitHashKey,
  PartitionKey,
  StreamName,
  ctx,
  kinesis = new aws.Kinesis(),
  records
}) {
  let largeRecords = [];
  let recordBatches = [];
  let recordBatch = {
    StreamName,
    Records: [],
    byteSize: 0
  };

  let toProcessCount = records.length;

  _.forEach(records, function(record) {
    let Data = JSON.stringify(record);
    let dataByteSize = Buffer.byteLength(JSON.stringify({
      Data: record,
      ExplicitHashKey,
      PartitionKey
    }));

    if (dataByteSize > limits.recordByteSize) {
      largeRecords.push(record);
      ctx.log.error(`Skipping record larger than ${limits.recordByteSize / 1024} KB: \
${dataByteSize / 1024} KB.`, {record});
      toProcessCount = toProcessCount - 1;
      return;
    }

    if (recordBatch.byteSize + dataByteSize > limits.batchByteSize ||
        recordBatch.Records.length + 1 > limits.batchRecord) {
      recordBatches.push(recordBatch);
      recordBatch = {
        StreamName,
        Records: [],
        byteSize: 0
      };
    }

    recordBatch.byteSize = recordBatch.byteSize + dataByteSize;

    recordBatch.Records.push({
      Data,
      PartitionKey
    });
  });

  recordBatches.push(recordBatch);
  recordBatches = _.reject(recordBatches, {byteSize: 0});

  let processedCount = await _putRecordBatches({kinesis, recordBatches});
  if (processedCount !== toProcessCount) {
    throw new Error(`Not all records processed. Expected ${toProcessCount}, actually ${processedCount}.`);
  }

  return {
    largeRecords
  };
};

export default exports;