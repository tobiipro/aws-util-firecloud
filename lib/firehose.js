"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.putRecords = exports._putRecordBatches = exports.limits = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

// see https://docs.aws.amazon.com/firehose/latest/dev/limits.html
let limits = {
  batchByteSize: 4 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1000 * 1024 };exports.limits = limits;


let _putRecordBatches = async function ({
  firehose,
  recordBatches })
{
  let processedCount = 0;

  // eslint-disable-next-line fp/no-loops, better/no-fors
  for (let recordBatch of recordBatches) {
    delete recordBatch.byteSize;
    await (async createError => {try {return await firehose.putRecordBatch(recordBatch).promise();} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
    processedCount = processedCount + recordBatch.Records.length;
  }

  return processedCount;
};exports._putRecordBatches = _putRecordBatches;

let putRecords = async function ({
  DeliveryStreamName,
  ctx,
  firehose = new _awsSdk.default.Firehose(),
  records })
{
  let largeRecords = [];
  let recordBatches = [];
  let recordBatch = {
    DeliveryStreamName,
    Records: [],
    byteSize: 0 };


  let toProcessCount = records.length;

  _lodashFirecloud.default.forEach(records, function (record) {
    let Data = JSON.stringify(record);
    Data = `${Data}\n`;
    let dataByteSize = Buffer.byteLength(Data);

    if (dataByteSize > exports.limits.recordByteSize) {
      largeRecords.push(record);
      ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/firehose.js" : __filename, babelFile: "src/firehose.js", line: 50, column: 7 } }, `Skipping record larger than ${exports.limits.recordByteSize / 1024} KB: \
${dataByteSize / 1024} KB.`, {
        record });

      toProcessCount = toProcessCount - 1;
      return;
    }

    if (recordBatch.byteSize + dataByteSize > exports.limits.batchByteSize ||
    recordBatch.Records.length + 1 > exports.limits.batchRecord) {
      recordBatches.push(recordBatch);
      recordBatch = {
        DeliveryStreamName,
        Records: [],
        byteSize: 0 };

    }

    recordBatch.byteSize = recordBatch.byteSize + dataByteSize;

    recordBatch.Records.push({
      Data });

  });

  recordBatches.push(recordBatch);
  recordBatches = _lodashFirecloud.default.reject(recordBatches, {
    byteSize: 0 });


  let processedCount = await (async createError => {try {return await exports._putRecordBatches({ firehose, recordBatches });} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());
  if (processedCount !== toProcessCount) {
    throw new Error(`Not all records processed. Expected ${toProcessCount}, actually ${processedCount}.`);
  }

  return {
    largeRecords };

};exports.putRecords = putRecords;var _default =

exports;exports.default = _default;

//# sourceMappingURL=firehose.js.map