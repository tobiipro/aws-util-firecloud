import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

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

    if (dataLength > 1000 * 1024) {
      // 1000 KB (not 1 MB) hard limit in Firehose http://docs.aws.amazon.com/firehose/latest/dev/limits.html
      ctx.log.error(`Skipping record larger than 1000 KB: ${dataLength / 1024} KB.`, {record});
      return;
    }

    // PutRecordBatch has a 4 MB limit and 500 records
    if (recordBatch.byteSize + dataLength > 4 * 1024 * 1024 ||
        recordBatch.Records.length + 1 > 500) {
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
