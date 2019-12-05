import _ from 'lodash-firecloud';
import aws from 'aws-sdk';

export let getDefaultTotalSegments = async function(TableName: aws.DynamoDB.TableName): Promise<number> {
  let db = new aws.DynamoDB();
  let {
    Table
  } = await db.describeTable({TableName}).promise();

  let TwoGigabytesInBytes = 2 * 1024 * 1024 * 1024;
  return Math.floor(Table.TableSizeBytes / TwoGigabytesInBytes) + 1;
};

export let scanWithBackticks = function(
  args: aws.DynamoDB.DocumentClient.ScanInput
): aws.DynamoDB.DocumentClient.ScanInput {
  if (_.isUndefined(args.FilterExpression)) {
    return args;
  }

  args.ExpressionAttributeNames = _.defaultTo(args.ExpressionAttributeNames, {});
  args.FilterExpression = _.replace(args.FilterExpression, /`([^`]+)`/g, function(_match, attrs) {
    attrs = _.split(attrs, '.');
    attrs = _.map(attrs, function(attr) {
      attr = _.replace(attr, /^#/, '');
      let safeAttr = _.replace(attr, /[^A-Za-z0-9]/g, '_');
      safeAttr = `#${safeAttr}`;
      // FIXME should I even bother checking if this is a reserved word
      args.ExpressionAttributeNames[safeAttr] = attr;
      return safeAttr;
    });
    attrs = attrs.join('.');
    return attrs;
  });
  return args;
};

export let dcScan = async function(args: aws.DynamoDB.DocumentClient.ScanInput, iteratee): Promise<void> {
  let dc = new aws.DynamoDB.DocumentClient();

  args = scanWithBackticks(args);
  // NOTE: we disable parallel scanning for now
  // until we reach >2GB dynamodb tables
  // args.TotalSegments =
  //   _.defaultTo(args.TotalSegments,
  //   await getDefaultTotalSegments(args.TableName));
  args.TotalSegments = 1;
  args.TotalSegments = _.max([
    1,
    args.TotalSegments
  ]);

  if (_.isDefined(args.Limit)) {
    args.Limit = _.ceil(args.Limit / args.TotalSegments);
  }

  let continueScan = true;
  let results = [] as aws.DynamoDB.DocumentClient.ScanOutput[];
  let limit: aws.DynamoDB.DocumentClient.ScanInput['Limit'];

  let scan = async function(): Promise<void> {
    await Promise.all(_.map(_.range(0, args.TotalSegments), async function(Segment) {
      let iteratorArgs = _.cloneDeep(args);
      iteratorArgs.Segment = Segment;

      if (_.isDefined(results[Segment])) {
        iteratorArgs.ExclusiveStartKey = results[Segment].LastEvaluatedKey;
      }
      // eslint-disable-next-line require-atomic-updates
      results[Segment] = await dc.scan(iteratorArgs).promise();
    }));

    _.forEach(results, function(result) {
      let cbResult = _.defaultTo(iteratee(result), true);

      if (_.isBoolean(cbResult)) {
        cbResult = {
          continueScan: cbResult
        };
      }

      limit = _.get(cbResult, 'args.Limit');
      continueScan =
        cbResult.continueScan !== false &&
        _.isDefined(result.LastEvaluatedKey);

      return continueScan;
    });

    if (!continueScan) {
      return;
    }

    if (_.isDefined(limit)) {
      // eslint-disable-next-line require-atomic-updates
      args.Limit = _.ceil(limit / args.TotalSegments);
    }

    await scan();
  };

  await scan();
};

export let dcPut = async function(
  args: aws.DynamoDB.DocumentClient.PutItemInput
): Promise<aws.DynamoDB.DocumentClient.PutItemOutput> {
  let dc = new aws.DynamoDB.DocumentClient();

  args.Item = _.mapValuesDeep(_.pickBy.bind(_))(args.Item, function(value) {
    return _.isDefined(value) && value !== '';
  });

  return await dc.put(args).promise();
};
