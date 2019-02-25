/* eslint-disable jest/no-test-callback */

import _ from 'lodash-firecloud';
import envCtx from '../../src/lambda/env-ctx';
import lambda from '../../src/lambda';

describe('lambda', function() {
  describe('bootstrap', function() {
    it("should call AWS' next with the handler's result", function(done) {
      let spy = jest.spyOn(envCtx, 'merge')
        .mockImplementation(_.noop);

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

        expect(spy).toHaveBeenCalled();
        spy.mockReset();
        spy.mockRestore();
        done();
      });
    });

    it("should call AWS' next with the handler's exception", function(done) {
      let spy = jest.spyOn(envCtx, 'merge')
        .mockImplementation(_.noop);

      let expectedErr = new Error();
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
      bHandler(e, ctx, function(err, result) {
        expect(err).toBe(expectedErr);
        expect(result).toBeUndefined();

        expect(spy).toHaveBeenCalled();
        spy.mockReset();
        spy.mockRestore();
        done();
      });
    });
  });
});
