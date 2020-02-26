"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.reduceToDependsOn = exports.isIntrinsicFun = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let isIntrinsicFun = function (Value) {
  if (!_lodashFirecloud.default.isPlainObject(Value)) {
    return false;
  }
  let keys = _lodashFirecloud.default.keys(Value);
  if (keys.length !== 1) {
    return false;
  }
  return /^(Fn::.*|Ref)$/.test(keys[0]);
};exports.isIntrinsicFun = isIntrinsicFun;

let reduceToDependsOn = function (acc, statement) {
  if (exports.isIntrinsicFun(statement)) {
    if (_lodashFirecloud.default.isDefined(statement.Ref)) {
      acc = acc.concat(statement.Ref);
    } else if (_lodashFirecloud.default.isDefined(statement['Fn::GetAtt'])) {
      // {'Fn::GetAtt': ['Ref', 'Att']}
      acc = acc.concat(statement['Fn::GetAtt'][0]);
    } else if (_lodashFirecloud.default.isString(statement['Fn::Sub'])) {
      // {'Fn::Sub': `${Ref}`}
      let subRefs = statement['Fn::Sub'].match(/\$\{[^}]+\}/g);
      subRefs = _lodashFirecloud.default.reject(subRefs, function (subRef) {
        return /^AWS::.+/.test(subRef);
      });
      _lodashFirecloud.default.forEach(subRefs, function (subRef) {
        subRef = _lodashFirecloud.default.defaultTo(/\$\{([^!][^.}]+)(\..+)?\}/.exec(subRef), [])[1];
        acc.push(subRef);
      });
    } else if (_lodashFirecloud.default.isArray(statement['Fn::Sub'])) {
      // {'Fn::Sub': [`${Ref}${Var}`, {Var: Value}]}
      let subRefs = statement['Fn::Sub'][0].match(/\$\{[^}]+\}/g);
      subRefs = _lodashFirecloud.default.reject(subRefs, function (subRef) {
        return /^AWS::.+/.test(subRef);
      });
      let subVars = _lodashFirecloud.default.keys(statement['Fn::Sub'][1]);
      subRefs = _lodashFirecloud.default.without(subRefs, ...subVars);
      _lodashFirecloud.default.forEach(subRefs, function (subRef) {
        subRef = subRef.match(/\$\{([^!][^.}]+)(\..+)?\}/)[1];
        acc.push(subRef);
      });
    }
  } else if (_lodashFirecloud.default.isObjectLike(statement)) {
    acc = acc.concat(_lodashFirecloud.default.reduce(statement, reduceToDependsOn, []));
  }

  return acc;
};exports.reduceToDependsOn = reduceToDependsOn;

//# sourceMappingURL=index.js.map