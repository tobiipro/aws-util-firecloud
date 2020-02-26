"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.getHostedZoneId = exports.hostedZones = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));

var _region = require("./region");function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}









let hostedZones = {
  apigateway: {
    'us-east-2': 'ZOJJZC49E0EPZ',
    'us-east-1': 'Z1UJRXOUMOOFQ8',
    'us-west-1': 'Z2MUQ32089INYE',
    'us-west-2': 'Z2OJLYMUO9EFXC',
    'ap-south-1': 'Z3VO1THU9YC4UR',
    'ap-northeast-2': 'Z20JF4UZKIW1U8',
    'ap-northeast-3': 'Z2YQB5RD63NC85',
    'ap-southeast-1': 'ZL327KTPIQFUL',
    'ap-southeast-2': 'Z2RPCDW04V8134',
    'ap-northeast-1': 'Z1YSHQZHG15GKL',
    'ca-central-1': 'Z19DQILCV0OWEC',
    'eu-central-1': 'Z1U9ULNL0V5AJ3',
    'eu-west-1': 'ZLY8HYME6SFDD',
    'eu-west-2': 'ZJ5UAJN8Y3Z2Q',
    'eu-west-3': 'Z3KY65QIEKYHQQ',
    'sa-east-1': 'ZCMLWB8V5SYIT' },


  cloudfront: 'Z2FDTNDATAQYW2',

  elasticbeanstalk: {
    'us-east-2': 'Z14LCN19Q5QHIC',
    'us-east-1': 'Z117KPS5GTRQ2G',
    'us-west-1': 'Z1LQECGX5PH1X',
    'us-west-2': 'Z38NKT9BP95V3O',
    'ca-central-1': 'ZJFCZL7SSZB5I',
    'ap-south-1': 'Z18NTBI3Y7N9TZ',
    'ap-northeast-2': 'Z3JE5OI70TWKCP',
    'ap-northeast-3': 'ZNE5GEY1TIAGY',
    'ap-southeast-1': 'Z16FZ9L249IFLT',
    'ap-southeast-2': 'Z2PCDNR3VC2G1N',
    'ap-northeast-1': 'Z1R25G3KIG2GBW',
    'eu-central-1': 'Z1FRNW7UH4DEZJ',
    'eu-west-1': 'Z2NYPWQ7DFZAZH',
    'eu-west-2': 'Z1GKAAAUGATPF1',
    'eu-west-3': 'Z5WN6GAYWG5OB',
    'sa-east-1': 'Z10X7K2B4QSOFV' },


  elasticloadbalancing: {
    'us-east-2': 'ZLMOA37VPKANP',
    'us-east-1': 'Z26RNL4JYFTOTI',
    'us-west-1': 'Z24FKFUX50B4VW',
    'us-west-2': 'Z18D5FSROUN65G',
    'ca-central-1': 'Z2EPGBW3API2WT',
    'ap-south-1': 'ZVDDRBQ08TROA',
    'ap-northeast-2': 'ZIBE1TIR4HY56',
    'ap-southeast-1': 'ZKVM4W9LS7TM',
    'ap-southeast-2': 'ZCT6FZBF4DROD',
    'ap-northeast-1': 'Z31USIVHYNEOWT',
    'eu-central-1': 'Z3F0SRJ5LGBH90',
    'eu-west-1': 'Z2IFOLAFXWLO4F',
    'eu-west-2': 'ZD4D7Y8KGAS4G',
    'eu-west-3': 'Z1CMS0P5QUZ6D5',
    'sa-east-1': 'ZTK26PT1VY4CU',

    classic: {
      'us-east-2': 'Z3AADJGX6KTTL2',
      'us-east-1': 'Z35SXDOTRQ7X7K',
      'us-west-1': 'Z368ELLRRE2KJ0',
      'us-west-2': 'Z1H1FL5HABSF5',
      'ca-central-1': 'ZQSVJUPU6J1EY',
      'ap-south-1': 'ZP97RAFLXTNZK',
      'ap-northeast-2': 'ZWKZPGTI48KDX',
      'ap-northeast-3': 'Z5LXEXXYW11ES',
      'ap-southeast-1': 'Z1LMS91P8CMLE5',
      'ap-southeast-2': 'Z1GM3OXH4ZPM65',
      'ap-northeast-1': 'Z14GRHDCWA56QT',
      'eu-central-1': 'Z215JYRZR1TBD5',
      'eu-west-1': 'Z32O12XQLNTSW2',
      'eu-west-2': 'ZHURV8PSTC4K8',
      'eu-west-3': 'Z3Q77PNBQS71R4',
      'sa-east-1': 'Z2P70J7HTTTPLU' } },



  's3-website': {
    'us-east-2': 'Z2O1EMRO9K5GLX',
    'us-east-1': 'Z3AQBSTGFYJSTF',
    'us-west-1': 'Z2F56UZL2M1ACD',
    'us-west-2': 'Z3BJ6K6RIION7M',
    'ca-central-1': 'Z1QDHH18159H29',
    'ap-south-1': 'Z11RGJOFQNVJUP',
    'ap-northeast-2': 'Z3W03O7B5YMIYP',
    'ap-northeast-3': 'Z2YQB5RD63NC85',
    'ap-southeast-1': 'Z3O0J2DXBE1FTB',
    'ap-southeast-2': 'Z1WCIGYICN2BYD',
    'ap-northeast-1': 'Z2M4EHUR26P7ZW',
    'eu-central-1': 'Z21DNDUVLTQW6Q',
    'eu-west-1': 'Z1BKCTXD74EZPE',
    'eu-west-2': 'Z3GKZC51ZF0DB4',
    'eu-west-3': 'Z3R1K369G5AVDG',
    'sa-east-1': 'Z7KQH4QJS55SO' } };exports.hostedZones = hostedZones;



let getHostedZoneId = function ({
  service,
  env,
  region })




{
  if (service === 'cloudfront') {
    return exports.hostedZones[service];
  }

  region = _lodashFirecloud.default.defaultTo(region, (0, _region.get)({ env }));

  let hostedZoneId = exports.hostedZones[service][region];
  return hostedZoneId;
};exports.getHostedZoneId = getHostedZoneId;

//# sourceMappingURL=r53.js.map