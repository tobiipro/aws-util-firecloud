import * as envCtx from '../../src/lambda/env-ctx';
import * as express from '../../src/express';
import _ from 'lodash-firecloud';

// eslint-disable-next-line firecloud/underscore-prefix-non-exported, @typescript-eslint/explicit-function-return-type
let AsyncFunction = Object.getPrototypeOf(async function() { /* noop */ }).constructor;

describe('express', function() {
  describe('bootstrap', function() {
    let expectedErr = new Error();

    _.forEach([
      function(app, _e, _ctx) {
        app.use(function(_req, _res, _next) {
          throw expectedErr;
        });
      },
      async function(app, _e, _ctx) {
        app.use(function(_req, _res, _next) {
          throw expectedErr;
        });
      }
    ], function(handler) {
      let type = handler instanceof AsyncFunction ? 'async' : 'sync';
      it(`should call AWS' next with the (${type}) middleware's exception`, async function() {
        let e = {
          httpMethod: 'GET',
          path: __filename
        };
        let ctx = {};

        let spyEnvCtxMerge = jest.spyOn(envCtx, 'merge');
        // @ts-ignore
        spyEnvCtxMerge.mockImplementationOnce(_.noop);

        let spyConsoleInfoD = _.deferred();
        // eslint-disable-next-line no-console
        let originalConsoleInfo = _.bind(console.info, console);
        let spyConsoleInfo = jest.spyOn(console, 'info');
        spyConsoleInfo.mockImplementation(function(...args) {
          let RE = new RegExp(`^Handling ${e.httpMethod} ${e.path}...`);
          let minlogMsg = args[4];
          if (RE.test(minlogMsg)) {
            spyConsoleInfoD.resolve();
          } else {
            originalConsoleInfo(...args);
          }
          // expect(minlogMsg).toMatch(RE);
        });

        let expectedMsg = 'FATAL try-catch-lambda-bootstrap';
        let spyConsoleErrorD = _.deferred();
        // eslint-disable-next-line no-console
        let originalConsoleError = _.bind(console.error, console);
        let spyConsoleError = jest.spyOn(console, 'error');
        spyConsoleError.mockImplementationOnce(function(...args) {
          if (args[0] !== expectedMsg) {
            originalConsoleError(...args);
          }
          expect(args[0]).toBe(expectedMsg);
        });
        spyConsoleError.mockImplementationOnce(function(...args) {
          if (args[0] !== expectedErr.stack) {
            originalConsoleError(...args);
          }
          expect(args[0]).toBe(expectedErr.stack);
        });
        spyConsoleError.mockImplementationOnce(function(...args) {
          let RE = /^Handling response error/;
          let minlogMsg = args[4];
          if (RE.test(minlogMsg)) {
            spyConsoleErrorD.resolve();
          } else {
            originalConsoleError(...args);
          }
          expect(minlogMsg).toMatch(RE);
        });

        let spyProcessExitD = _.deferred();
        let spyProcessExit = jest.spyOn(process, 'exit');
        // @ts-ignore
        spyProcessExit.mockImplementationOnce(function() {
          spyProcessExitD.resolve();
        });

        // @ts-ignore
        let bHandler = express.bootstrap(handler, {
          pkg: {
            name: 'test'
          }
        });
        bHandler(e, ctx, _.noop);

        await spyProcessExitD.promise;
        expect(spyProcessExit).toHaveBeenCalledTimes(1);
        expect(spyProcessExit).toHaveBeenCalledWith(1);
        spyProcessExit.mockRestore();

        await spyConsoleInfoD.promise;
        expect(spyConsoleInfo).toHaveBeenCalled();
        spyConsoleInfo.mockRestore();

        await spyConsoleErrorD.promise;
        expect(spyConsoleError).toHaveBeenCalledTimes(3);
        spyConsoleError.mockRestore();

        expect(spyEnvCtxMerge).toHaveBeenCalledTimes(1);
        spyEnvCtxMerge.mockRestore();

        await ctx.log.flush();
      });
    });
  });
});
