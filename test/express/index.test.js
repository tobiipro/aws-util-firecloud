import * as envCtx from '../../src/lambda/env-ctx';
import * as express from '../../src/express';
import _ from 'lodash-firecloud';

describe('express', function() {
  describe('bootstrap', function() {
    it("should call AWS' next with the handler's HTTP response", async function() {
      let e = {
        httpMethod: 'GET',
        path: __filename
      };
      let ctx = {};

      let d = _.deferred();
      let spyEnvCtxMerge = jest.spyOn(envCtx, 'merge');
      // @ts-ignore
      spyEnvCtxMerge.mockImplementation(_.noop);

      let expectedResult = 'expected result';
      let handler = async function(app, _e, _ctx) {
        app.use(function(_req, res, _next) {
          res.send(expectedResult);
        });
      };

      let bHandler = express.bootstrap(handler, {
        pkg: {
          name: 'test'
        }
      });
      bHandler(e, ctx, async function(err, result) {
        expect(err).toBeUndefined();
        expect(result).toMatchObject({
          statusCode: 200,
          headers: {
            'content-length': '15'
          },
          body: expectedResult
        });

        expect(spyEnvCtxMerge).toHaveBeenCalled();
        spyEnvCtxMerge.mockRestore();

        await ctx.log.flush();
        d.resolve();
      });

      await d.promise;
    });

    it("should call AWS' next with the handler's exception", async function() {
      let e = {
        httpMethod: 'GET',
        path: __filename
      };
      let ctx = {};

      let spyEnvCtxMerge = jest.spyOn(envCtx, 'merge');
      spyEnvCtxMerge.mockImplementationOnce(_.noop);

      let expectedMsg = 'FATAL try-catch-lambda-bootstrap';
      let expectedErr = new Error();
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

      let spyProcessExitD = _.deferred();
      let spyProcessExit = jest.spyOn(process, 'exit');
      // @ts-ignore
      spyProcessExit.mockImplementationOnce(function(...args) {
        // @ts-ignore
        spyProcessExitD.resolve(args);
      });

      let handler = async function(_e, _ctx) {
        throw expectedErr;
      };

      let bHandler = express.bootstrap(handler, {
        pkg: {
          name: 'test'
        }
      });
      bHandler(e, ctx, _.noop);

      let processExitArgs = await spyProcessExitD.promise;
      expect(processExitArgs).toStrictEqual([
        1
      ]);

      expect(spyConsoleError).toHaveBeenCalled();
      spyConsoleError.mockRestore();

      expect(spyProcessExit).toHaveBeenCalledTimes(1);
      spyProcessExit.mockRestore();

      expect(spyEnvCtxMerge).toHaveBeenCalled();
      spyEnvCtxMerge.mockRestore();
    });
  });
});
