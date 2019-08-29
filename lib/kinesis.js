"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.putRecords = exports._putRecordBatches = exports.limits = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

// see https://docs.aws.amazon.com/kinesis/latest/APIReference/API_PutRecords.html
let limits = {
  batchByteSize: 5 * 1024 * 1024,
  batchRecord: 500,
  recordByteSize: 1024 * 1024 };exports.limits = limits;


let _putRecordBatches = async function ({
  kinesis,
  recordBatches })
{
  let processedCount = 0;

  // eslint-disable-next-line fp/no-loops, better/no-fors
  for (let recordBatch of recordBatches) {
    delete recordBatch.byteSize;
    await (async createError => {try {return await kinesis.putRecordBatch(recordBatch).promise();} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
    processedCount = processedCount + recordBatch.Records.length;
  }

  return processedCount;
};exports._putRecordBatches = _putRecordBatches;

let putRecords = async function ({
  ExplicitHashKey,
  PartitionKey,
  StreamName,
  ctx,
  kinesis = new _awsSdk.default.Kinesis(),
  records })
{
  let largeRecords = [];
  let recordBatches = [];
  let recordBatch = {
    StreamName,
    Records: [],
    byteSize: 0 };


  let toProcessCount = records.length;

  _lodashFirecloud.default.forEach(records, function (record) {
    let Data = JSON.stringify(record);
    let dataByteSize = Buffer.byteLength(JSON.stringify({
      Data: record,
      ExplicitHashKey,
      PartitionKey }));


    if (dataByteSize > exports.limits.recordByteSize) {
      largeRecords.push(record);
      ctx.log.error({ _babelSrc: { file: typeof __filename === "undefined" ? "src/kinesis.js" : __filename, babelFile: "src/kinesis.js", line: 55, column: 7 } }, `Skipping record larger than ${exports.limits.recordByteSize / 1024} KB: \
${dataByteSize / 1024} KB.`, {
        record });

      toProcessCount = toProcessCount - 1;
      return;
    }

    if (recordBatch.byteSize + dataByteSize > exports.limits.batchByteSize ||
    recordBatch.Records.length + 1 > exports.limits.batchRecord) {
      recordBatches.push(recordBatch);
      recordBatch = {
        StreamName,
        Records: [],
        byteSize: 0 };

    }

    recordBatch.byteSize = recordBatch.byteSize + dataByteSize;

    recordBatch.Records.push({
      Data,
      PartitionKey });

  });

  recordBatches.push(recordBatch);
  recordBatches = _lodashFirecloud.default.reject(recordBatches, {
    byteSize: 0 });


  let processedCount = await (async createError => {try {return await exports._putRecordBatches({ kinesis, recordBatches });} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());
  if (processedCount !== toProcessCount) {
    throw new Error(`Not all records processed. Expected ${toProcessCount}, actually ${processedCount}.`);
  }

  return {
    largeRecords };

};exports.putRecords = putRecords;var _default =

exports;exports.default = _default;

//# sourceMappingURL=kinesis.js.map