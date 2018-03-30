"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
let reduceToAttributeDefinitions = exports.reduceToAttributeDefinitions = function (acc, AttributeType, AttributeName) {
  return acc.concat([{
    AttributeName,
    AttributeType
  }]);
};

let reduceToKeySchema = exports.reduceToKeySchema = function (acc, KeyType, AttributeName) {
  return acc.concat([{
    AttributeName,
    KeyType
  }]);
};

//# sourceMappingURL=dynamodb.js.map