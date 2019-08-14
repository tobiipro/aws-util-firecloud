"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.reduceToKeySchema = exports.reduceToAttributeDefinitions = void 0;let reduceToAttributeDefinitions = function (
acc,
AttributeType,
AttributeName)
{
  return acc.concat([{
    AttributeName,
    AttributeType }]);

};exports.reduceToAttributeDefinitions = reduceToAttributeDefinitions;

let reduceToKeySchema = function (acc, KeyType, AttributeName) {
  return acc.concat([{
    AttributeName,
    KeyType }]);

};exports.reduceToKeySchema = reduceToKeySchema;

//# sourceMappingURL=dynamodb.js.map