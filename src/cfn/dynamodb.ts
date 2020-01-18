export let reduceToAttributeDefinitions = function(
  acc,
  AttributeType,
  AttributeName
) {
  return acc.concat([{
    AttributeName,
    AttributeType
  }]);
};

export let reduceToKeySchema = function(acc, KeyType, AttributeName) {
  return acc.concat([{
    AttributeName,
    KeyType
  }]);
};
