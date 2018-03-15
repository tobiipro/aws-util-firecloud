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

        if (res.ctx.log.level() > res.ctx.log.resolveLevel('TRACE')) {
          // if no trace is desired, we'd better just exit
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }

        if (res.headersSent) {
          // we cannot amend the response anymore
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }

        // NOTE we prioritize responding with a body that includes error details
        // and exits on the next call.
        // The exit is required, in order to guarantee a clean state,
        // as opposed to the borked one in which the error was triggered.
        let trace = err.stack ? _lodashFirecloud2.default.split(err.stack, '\n') : err;

        res.ctx.callbackWaitsForEmptyEventLoop = false;
        _lodashFirecloud2.default.delay(function () {
          // this will run on the next call,
          // because calling res.send will immediately freeze the process,
          // only to be unfrozen by the next call
          // eslint-disable-next-line no-process-exit
          process.exit(1);
        }, 1000);

        res.status(500);
        res.set({
          'content-type': 'application/problem+json'
        });
        res.send({
          type: 'about:blank',
          title: 'Internal Server Error',
          status: 500,
          instance: (0, _lambda.getRequestInstance)(req),
          renderer: 'lambda-util',
          trace
        });
      }
    });

    return function () {
      return _ref.apply(this, arguments);
    };
  })());
};

exports.default = exports;

//# sourceMappingURL=express-middleware.js.map