'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.reduceToDependsOn = exports.isIntrinsicFun = undefined;

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let isIntrinsicFun = exports.isIntrinsicFun = function (Value) {
  if (!_lodashFirecloud2.default.isPlainObject(Value)) {
    return false;
  }
  let keys = _lodashFirecloud2.default.keys(Value);
  if (keys.length !== 1) {
    return false;
  }
  return (/^(Fn::.*|Ref)$/.test(keys[0])
  );
};

let reduceToDependsOn = exports.reduceToDependsOn = function (acc, statement) {
  if (exports.isIntrinsicFun(statement)) {
    if (statement.Ref) {
      acc = acc.concat(statement.Ref);
    } else if (statement['Fn::GetAtt']) {
      // {'Fn::GetAtt': ['Ref', 'Att']}
      acc = acc.concat(statement['Fn::GetAtt'][0]);
    } else if (_lodashFirecloud2.default.isString(statement['Fn::Sub'])) {
      // {'Fn::Sub': `${Ref}`}
      let subRefs = statement['Fn::Sub'].match(/\$\{[^}]+\}/g);
      _lodashFirecloud2.default.remove(subRefs, function (subRef) {
        return (/^AWS::.+/.test(subRef)
        );
      });
      _lodashFirecloud2.default.forEach(subRefs, function (subRef) {
        subRef = subRef.match(/\$\{([^!][^.}]+)(\..+)?\}/)[1];
        acc.push(subRef);
      });
    } else if (_lodashFirecloud2.default.isArray(statement['Fn::Sub'])) {
      // {'Fn::Sub': [`${Ref}${Var}`, {Var: Value}]}
      let subRefs = statement['Fn::Sub'][0].match(/\$\{[^}]+\}/g);
      _lodashFirecloud2.default.remove(subRefs, function (subRef) {
        return (/^AWS::.+/.test(subRef)
        );
      });
      let subVars = _lodashFirecloud2.default.keys(statement['Fn::Sub'][1]);
      subRefs = _lodashFirecloud2.default.without(subRefs, ...subVars);
      _lodashFirecloud2.default.forEach(subRefs, function (subRef) {
        subRef = subRef.match(/\$\{([^!][^.}]+)(\..+)?\}/)[1];
        acc.push(subRef);
      });
    }
  } else if (_lodashFirecloud2.default.isObjectLike(statement)) {
    acc = acc.concat(_lodashFirecloud2.default.reduce(statement, exports.reduceToDependsOn, []));
  }

  return acc;
};

//# sourceMappingURL=index.js.map