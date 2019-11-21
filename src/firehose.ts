import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

import {
  LambdaContext
} from './types';

type RecordBatch = {
  DeliveryStreamName: aws.Firehose.DeliveryStreamName;
  Records: aws.Firehose.Record[];
  byteSize: number;
};

// see https://docs.aws.amazon.com/firehose/latest/dev/limits.html
export let limits = {
  batchByteSize: 4 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1000 * 1024
};

let _putRecordBatches = async function({
  firehose,
  recordBatches
}): Promise<number> {
  let processedCount = 0;

  for (let recordBatch of recordBatches) {
    delete recordBatch.byteSize;
    await firehose.putRecordBatch(recordBatch).promise();
    processedCount = processedCount + (recordBatch.Records as any[]).length;
  }

  return processedCount;
};

export let putRecords = async function({
  DeliveryStreamName,
  ctx,
  firehose = new aws.Firehose(),
  records
}: {
  DeliveryStreamName: aws.Firehose.DeliveryStreamName;
  ctx: LambdaContext;
  firehose: aws.Firehose;
  records: aws.Firehose.Record[];
}): Promise<void | {
    largeRecords: aws.Firehose.Record[];
  }> {
  let largeRecords = [] as aws.Firehose.Record[];
  let recordBatches = [] as RecordBatch[];
  let recordBatch = {
    DeliveryStreamName,
    Records: [],
    byteSize: 0
  } as RecordBatch;

  let toProcessCount = records.length;

  for (let record of records) {
    let Data = JSON.stringify(record);
    Data = `${Data}\n`;
    let dataByteSize = Buffer.byteLength(Data);

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
        DeliveryStreamName,
        Records: [],
        byteSize: 0
      } as RecordBatch;
    }

    recordBatch.byteSize = recordBatch.byteSize + dataByteSize;

    recordBatch.Records.push({
      Data
    });
  }

  recordBatches.push(recordBatch);
  recordBatches = _.reject(recordBatches, function(recordBatch) {
    return recordBatch.byteSize === 0;
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
