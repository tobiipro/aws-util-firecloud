'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reduceToOptionSettings = exports.getLatestNodejsELB = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _config = require('../config');

var _2 = require('.');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let getLatestNodejsELB = exports.getLatestNodejsELB = (() => {
  var _ref = (0, _bluebird.coroutine)(function* ({ env }) {
    let ec2 = new _awsSdk2.default.EC2((0, _config.get)({ env }));

    let image = _lodashFirecloud2.default.last((yield ec2.describeImages({
      Filters: [{
        Name: 'name',
        Values: ['aws-elasticbeanstalk-amzn-*.x86_64-nodejs-pv-*']
      }]
    }).promise()).Images);

    return image;
  });

  return function getLatestNodejsELB(_x) {
    return _ref.apply(this, arguments);
  };
})();

let reduceToOptionSettings = exports.reduceToOptionSettings = function (acc, options, Namespace) {
  return acc.concat(_lodashFirecloud2.default.reduce(options, function (acc, Value, OptionName) {
    if (_lodashFirecloud2.default.isNil(Value)) {
      return acc;
    }
    // Value can only be string
    if (_lodashFirecloud2.default.isArray(Value)) {
      if (_lodashFirecloud2.default.filter(Value, _2.isIntrinsicFun).length) {
        Value = Value.join();
      }
    } else if (_lodashFirecloud2.default.isPlainObject(Value)) {
      if (!(0, _2.isIntrinsicFun)(Value)) {
        Value = JSON.stringify(Value);
      }
    } else if (_lodashFirecloud2.default.isString(Value) || _lodashFirecloud2.default.isFinite(Value) || _lodashFirecloud2.default.isBoolean(Value)) {
      Value = Value.toString();
    } else {
      throw new Error(_lodashFirecloud2.default.replace(`
        Unsupported type for reduceToBeanstalkOptionSettings:
        '${OptionName}' was given ${Value}`, /^ +/gm, ''));
    }
    return acc.concat([{
      Namespace,
      OptionName,
      Value
    }]);
  }, []));
};

//# sourceMappingURL=elb.js.map