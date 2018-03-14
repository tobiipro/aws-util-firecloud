'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bootstrap = undefined;

var _bluebird = require('bluebird/js/release/bluebird');

var _lodashFirecloud = require('lodash-firecloud');

var _lodashFirecloud2 = _interopRequireDefault(_lodashFirecloud);

var _lambda = require('./lambda');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let bootstrap = exports.bootstrap = function (fn) {
  return (0, _lambda.asyncHandler)((() => {
    var _ref = (0, _bluebird.coroutine)(function* (...args) {
      let res = args[1];
      let req = args[args.length - 3];

      try {
        yield fn(...args);
      } catch (err) {
        res.log.error({ err });
        if (res.headersSent) {
          return;
        }

        let trace;
        if (res.ctx.log.level() <= res.ctx.log.resolveLevel('TRACE')) {
          trace = err.stack ? _lodashFirecloud2.default.split(err.stack, '\n') : err;
        }

        res.ctx.callbackWaitsForEmptyEventLoop = false;

        res.status(500);
        res.set('content-type', 'application/problem+json');
        res.send({
          type: 'about:blank',
          title: 'Internal Server Error',
          status: 500,
          instance: (0, _lambda.getRequestInstance)(req),
          renderer: 'lambda-util',
          trace
        });

        // don't process.exit()
      }
    });

    return function () {
      return _ref.apply(this, arguments);
    };
  })());
};

exports.default = exports;

//# sourceMappingURL=express-middleware.js.map