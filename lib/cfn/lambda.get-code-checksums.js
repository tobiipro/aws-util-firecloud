"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.getCodeChecksums = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _config = require("../config");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



let getCodeChecksums = async function ({
  Code,
  algorithm = 'sha256',
  env })
{
  let s3 = new _awsSdk.default.S3((0, _config.get)({ env }));

  let Bucket = Code.S3Bucket;
  let Key = `${Code.S3Key}.${algorithm}sum`;

  let getObjectResp;
  try {
    getObjectResp = await (async createError => {try {return await s3.getObject({
          Bucket,
          Key }).
        promise();} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(err, {
      Bucket,
      Key });

    return [];
  }

  let {
    Body } =
  getObjectResp;
  Body = Body.toString();

  let checksums = {};
  _lodashFirecloud.default.forEach(_lodashFirecloud.default.split(_lodashFirecloud.default.trim(Body), '\n'), function (line) {
    let [
    checksum,
    filename] =
    _lodashFirecloud.default.split(line, '  ');
    checksums[filename] = checksum;
  });

  let filename = _lodashFirecloud.default.last(_lodashFirecloud.default.split(Code.S3Key, '/'));

  return [
  checksums[`${filename}.info`],
  checksums[`core.${filename}.info`]];

};exports.getCodeChecksums = getCodeChecksums;var _default = exports.getCodeChecksums;exports.default = _default;

//# sourceMappingURL=lambda.get-code-checksums.js.map