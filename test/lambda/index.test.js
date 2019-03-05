/* eslint-disable jest/no-test-callback */

import _ from 'lodash-firecloud';
import envCtx from '../../src/lambda/env-ctx';
import lambda from '../../src/lambda';

describe('lambda', function() {
  describe('bootstrap', function() {
    it("should call AWS' next with the handler's result", function(done) {
      let spyEnvCtxMerge = jest.spyOn(envCtx, 'merge')
        .mockImplementationOnce(_.noop);

      let expectedResult = Symbol('result');
      let handler = async function(_e, _ctx) {
        return expectedResult;
      };

      let bHandler = lambda.bootstrap(handler, {
        pkg: {
          name: 'test'
        }
      });

      let e = {};
      let ctx = {};
      bHandler(e, ctx, function(err, result) {
        expect(err).toBeUndefined();
        expect(result).toBe(expectedResult);

        expect(spyEnvCtxMerge).toHaveBeenCalled();
        spyEnvCtxMerge.mockRestore();
        done();
      });
    });

    it('should call process.exit when the handler throws an exception', async function() {
      let spyEnvCtxMerge = jest.spyOn(envCtx, 'merge')
        .mockImplementationOnce(_.noop);

      let expectedErr = new Error();
      // eslint-disable-next-line no-console
      let originalConsoleError = _.bind(console.error, console);
      let spyConsoleError = jest.spyOn(console, 'error')
        .mockImplementationOnce(function(...args) {
          let receivedErr = args[0];
          if (receivedErr !== expectedErr) {
            originalConsoleError(...args);
          }
          expect(receivedErr).toBe(expectedErr);
        });

      let spyProcessExitD = _.defer();
      let spyProcessExit = jest.spyOn(process, 'exit')
        .mockImplementationOnce(function(...args) {
          spyProcessExitD.resolve(args);
        });

      let handler = async function(_e, _ctx) {
        throw expectedErr;
      };

      let bHandler = lambda.bootstrap(handler, {
        pkg: {
          name: 'test'
        }
      });

      let e = {};
      let ctx = {};
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
