"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.reduceToOptionSettings = exports.getLatestNodejsELB = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _2 = require(".");



var _config = require("../config");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}



let getLatestNodejsELB = async function ({ env }) {
  let ec2 = new _awsSdk.default.EC2((0, _config.get)({ env }));

  let image = _lodashFirecloud.default.last((await (async createError => {try {return await ec2.describeImages({
        Filters: [{
          Name: 'name',
          Values: [
          'aws-elasticbeanstalk-amzn-*.x86_64-nodejs-pv-*'] }] }).


      promise();} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error())).Images);

  return image;
};exports.getLatestNodejsELB = getLatestNodejsELB;

let reduceToOptionSettings = function (acc, options, Namespace) {
  return acc.concat(_lodashFirecloud.default.reduce(options, function (acc, Value, OptionName) {
    if (_lodashFirecloud.default.isNil(Value)) {
      return acc;
    }
    // Value can only be string
    if (_lodashFirecloud.default.isArray(Value)) {
      if (_lodashFirecloud.default.filter(Value, _2.isIntrinsicFun).length) {
        Value = Value.join();
      }
    } else if (_lodashFirecloud.default.isPlainObject(Value)) {
      if (!(0, _2.isIntrinsicFun)(Value)) {
        Value = JSON.stringify(Value);
      }
    } else if (_lodashFirecloud.default.isString(Value) || _lodashFirecloud.default.isFinite(Value) || _lodashFirecloud.default.isBoolean(Value)) {
      Value = Value.toString();
    } else {
      throw new Error(_lodashFirecloud.default.replace(`
        Unsupported type for reduceToBeanstalkOptionSettings:
        '${OptionName}' was given ${Value}`, /^ +/gm, ''));
    }
    return acc.concat([{
      Namespace,
      OptionName,
      Value }]);

  }, []));
};exports.reduceToOptionSettings = reduceToOptionSettings;

//# sourceMappingURL=elb.js.map