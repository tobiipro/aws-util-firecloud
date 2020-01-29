"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.dcPut = exports.dcScan = exports.scanWithBackticks = exports.getDefaultTotalSegments = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let getDefaultTotalSegments = async function (TableName) {
  let db = new _awsSdk.default.DynamoDB();
  let {
    Table } = await (async createError => {try {return (
        await db.describeTable({ TableName }).promise());} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());

  let TwoGigabytesInBytes = 2 * 1024 * 1024 * 1024;
  return Math.floor(Table.TableSizeBytes / TwoGigabytesInBytes) + 1;
};exports.getDefaultTotalSegments = getDefaultTotalSegments;

let scanWithBackticks = function (
args)
{
  if (_lodashFirecloud.default.isUndefined(args.FilterExpression)) {
    return args;
  }

  args.ExpressionAttributeNames = _lodashFirecloud.default.defaultTo(args.ExpressionAttributeNames, {});
  args.FilterExpression = _lodashFirecloud.default.replace(args.FilterExpression, /`([^`]+)`/g, function (_match, attrs) {
    attrs = _lodashFirecloud.default.split(attrs, '.');
    attrs = _lodashFirecloud.default.map(attrs, function (attr) {
      attr = _lodashFirecloud.default.replace(attr, /^#/, '');
      let safeAttr = _lodashFirecloud.default.replace(attr, /[^A-Za-z0-9]/g, '_');
      safeAttr = `#${safeAttr}`;
      // FIXME should I even bother checking if this is a reserved word
      args.ExpressionAttributeNames[safeAttr] = attr;
      return safeAttr;
    });
    attrs = attrs.join('.');
    return attrs;
  });
  return args;
};exports.scanWithBackticks = scanWithBackticks;

let dcScan = async function (args, iteratee) {
  let dc = new _awsSdk.default.DynamoDB.DocumentClient();

  args = exports.scanWithBackticks(args);
  // NOTE: we disable parallel scanning for now
  // until we reach >2GB dynamodb tables
  // args.TotalSegments =
  //   _.defaultTo(args.TotalSegments,
  //   await getDefaultTotalSegments(args.TableName));
  args.TotalSegments = 1;
  args.TotalSegments = _lodashFirecloud.default.max([
  1,
  args.TotalSegments]);


  if (_lodashFirecloud.default.isDefined(args.Limit)) {
    args.Limit = _lodashFirecloud.default.ceil(args.Limit / args.TotalSegments);
  }

  let continueScan = true;
  let results = [];
  let limit;

  let scan = async function () {
    await (async createError => {try {return await Promise.all(_lodashFirecloud.default.map(_lodashFirecloud.default.range(0, args.TotalSegments), async function (Segment) {
          let iteratorArgs = _lodashFirecloud.default.cloneDeep(args);
          iteratorArgs.Segment = Segment;

          if (_lodashFirecloud.default.isDefined(results[Segment])) {
            iteratorArgs.ExclusiveStartKey = results[Segment].LastEvaluatedKey;
          }
          // eslint-disable-next-line require-atomic-updates
          results[Segment] = await (async createError => {try {return await dc.scan(iteratorArgs).promise();} catch (_awaitTraceErr3) {let err = createError();_awaitTraceErr3.stack += "\n...\n" + err.stack;throw _awaitTraceErr3;}})(() => new Error());
        }));} catch (_awaitTraceErr2) {let err = createError();_awaitTraceErr2.stack += "\n...\n" + err.stack;throw _awaitTraceErr2;}})(() => new Error());

    _lodashFirecloud.default.forEach(results, function (result) {
      let cbResult = _lodashFirecloud.default.defaultTo(iteratee(result), true);

      if (_lodashFirecloud.default.isBoolean(cbResult)) {
        cbResult = {
          continueScan: cbResult };

      }

      limit = _lodashFirecloud.default.get(cbResult, 'args.Limit');
      continueScan =
      cbResult.continueScan !== false &&
      _lodashFirecloud.default.isDefined(result.LastEvaluatedKey);

      return continueScan;
    });

    if (!continueScan) {
      return;
    }

    if (_lodashFirecloud.default.isDefined(limit)) {
      // eslint-disable-next-line require-atomic-updates
      args.Limit = _lodashFirecloud.default.ceil(limit / args.TotalSegments);
    }

    await (async createError => {try {return await scan();} catch (_awaitTraceErr4) {let err = createError();_awaitTraceErr4.stack += "\n...\n" + err.stack;throw _awaitTraceErr4;}})(() => new Error());
  };

  await (async createError => {try {return await scan();} catch (_awaitTraceErr5) {let err = createError();_awaitTraceErr5.stack += "\n...\n" + err.stack;throw _awaitTraceErr5;}})(() => new Error());
};exports.dcScan = dcScan;

let dcPut = async function (
args)
{
  let dc = new _awsSdk.default.DynamoDB.DocumentClient();

  args.Item = _lodashFirecloud.default.mapValuesDeep(_lodashFirecloud.default.pickBy.bind(_lodashFirecloud.default))(args.Item, function (value) {
    return _lodashFirecloud.default.isDefined(value) && value !== '';
  });

  return await (async createError => {try {return await dc.put(args).promise();} catch (_awaitTraceErr6) {let err = createError();_awaitTraceErr6.stack += "\n...\n" + err.stack;throw _awaitTraceErr6;}})(() => new Error());
};exports.dcPut = dcPut;

//# sourceMappingURL=dynamodb.js.map