import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  LambdaContext
} from './types';

type RecordBatch = {
  StreamName: aws.Kinesis.StreamName;
  Records: aws.Kinesis.PutRecordsRequestEntry[];
  byteSize: number;
};

// see https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecords.html
export let limits = {
  batchByteSize: 5 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1024 * 1024
};

let _putRecordBatches = async function({
  kinesis,
  recordBatches
}: {
  kinesis: aws.Kinesis;
  recordBatches: RecordBatch[];
}): Promise<number> {
  let processedCount = 0;

  for (let recordBatch of recordBatches) {
    await kinesis.putRecords({
      StreamName: recordBatch.StreamName,
      Records: recordBatch.Records
    }).promise();
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
}: {
  ExplicitHashKey: aws.Kinesis.HashKey;
  PartitionKey: aws.Kinesis.PartitionKey;
  StreamName: aws.Kinesis.StreamName;
  ctx: LambdaContext;
  kinesis: aws.Kinesis;
  records: any[];
}): Promise<void | {
    largeRecords: aws.Kinesis.PutRecordsRequestEntry[];
  }> {
  let largeRecords = [] as aws.Kinesis.PutRecordsRequestEntry[];
  let recordBatches = [] as RecordBatch[];
  let recordBatch = {
    StreamName,
    Records: [],
    byteSize: 0
  } as RecordBatch;

  let toProcessCount = records.length;

  for (let record of records) {
    let Data = JSON.stringify(record);
    let dataByteSize = Buffer.byteLength(JSON.stringify({
      Data: record,
      ExplicitHashKey,
      PartitionKey
    }));

    if (dataByteSize > limits.recordByteSize) {
      largeRecords.push(record);
      await ctx.log.error(`Skipping record larger than ${limits.recordByteSize / 1024} KB: \
${dataByteSize / 1024} KB.`, {
        record
      });
      toProcessCount = toProcessCount - 1;
      continue;
    }

    if (recordBatch.byteSize + dataByteSize > limits.batchByteSize ||
        recordBatch.Records.length + 1 > limits.batchRecord) {
      recordBatches.push(recordBatch);
      recordBatch = {
        StreamName,
        Records: [],
        byteSize: 0
      } as RecordBatch;
    }

    recordBatch.byteSize = recordBatch.byteSize + dataByteSize;

    recordBatch.Records.push({
      Data,
      PartitionKey
    });
  }

  recordBatches.push(recordBatch);
  recordBatches = _.reject(recordBatches, {
    byteSize: 0
  });

  let processedCount = await _putRecordBatches({kinesis, recordBatches});
  if (processedCount !== toProcessCount) {
    throw new Error(`Not all records processed. Expected ${toProcessCount}, actually ${processedCount}.`);
  }

  return {
    largeRecords
  };
};

export default exports;
