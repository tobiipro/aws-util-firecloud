import _ from 'lodash-firecloud';

export let isIntrinsicFun = function(Value) {
  if (!_.isPlainObject(Value)) {
    return false;
  }
  let keys = _.keys(Value);
  if (keys.length !== 1) {
    return false;
  }
  return /^(Fn::.*|Ref)$/.test(keys[0]);
};

export let reduceToDependsOn = function(acc, statement) {
  if (isIntrinsicFun(statement)) {
    if (statement.Ref) {
      acc = acc.concat(statement.Ref);
    } else if (statement['Fn::GetAtt']) {
      // {'Fn::GetAtt': ['Ref', 'Att']}
      acc = acc.concat(statement['Fn::GetAtt'][0]);
    } else if (_.isString(statement['Fn::Sub'])) {
      // {'Fn::Sub': `${Ref}`}
      let subRefs = statement['Fn::Sub'].match(/\$\{[^}]+\}/g);
      subRefs = _.reject(subRefs, function(subRef) {
        return /^AWS::.+/.test(subRef);
      });
      _.forEach(subRefs, function(subRef) {
        subRef = subRef.match(/\$\{([^!][^.}]+)(\..+)?\}/)[1];
        acc.push(subRef);
      });
    } else if (_.isArray(statement['Fn::Sub'])) {
      // {'Fn::Sub': [`${Ref}${Var}`, {Var: Value}]}
      let subRefs = statement['Fn::Sub'][0].match(/\$\{[^}]+\}/g);
      subRefs = _.reject(subRefs, function(subRef) {
        return /^AWS::.+/.test(subRef);
      });
      let subVars = _.keys(statement['Fn::Sub'][1]);
      subRefs = _.without(subRefs, ...subVars);
      _.forEach(subRefs, function(subRef) {
        subRef = subRef.match(/\$\{([^!][^.}]+)(\..+)?\}/)[1];
        acc.push(subRef);
      });
    }
  } else if (_.isObjectLike(statement)) {
    acc = acc.concat(_.reduce(statement, reduceToDependsOn, []));
  }

  return acc;
};
