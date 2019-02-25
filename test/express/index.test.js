/* eslint-disable jest/no-test-callback */

import ResponseError from '../../src/express/res-error';
import _ from 'lodash-firecloud';
import envCtx from '../../src/lambda/env-ctx';
import express from '../../src/express';

describe('express', function() {
  describe('bootstrap', function() {
    it("should call AWS' next with the handler's HTTP response", function(done) {
      let spyMergeEnvCtx = jest.spyOn(envCtx, 'merge')
        .mockImplementation(_.noop);

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

      let e = {};
      let ctx = {};
      bHandler(e, ctx, function(err, result) {
        expect(err).toBeUndefined();
        expect(result).toMatchObject({
          statusCode: 200,
          headers: {
            'content-length': '15'
          },
          body: expectedResult
        });

        expect(spyMergeEnvCtx).toHaveBeenCalled();
        spyMergeEnvCtx.mockReset();
        spyMergeEnvCtx.mockRestore();
        done();
      });
    });

    it("should call AWS' next with the handler's exception", function(done) {
      let spyMergeEnvCtx = jest.spyOn(envCtx, 'merge')
        .mockImplementation(_.noop);

      let expectedErr = new Error();
      let handler = async function(_app, _e, _ctx) {
        throw expectedErr;
      };

      let bHandler = express.bootstrap(handler, {
        pkg: {
          name: 'test'
        }
      });

      let e = {};
      let ctx = {};
      bHandler(e, ctx, function(err, result) {
        expect(err).toBe(expectedErr);
        expect(result).toBeUndefined();

        expect(spyMergeEnvCtx).toHaveBeenCalled();
        spyMergeEnvCtx.mockReset();
        spyMergeEnvCtx.mockRestore();
        done();
      });
    });

    it("should call AWS' next with the (sync) middleware's exception", async function() {
      let spyMergeEnvCtx = jest.spyOn(envCtx, 'merge')
        .mockImplementation(_.noop);

      let spyExitResolve;
      let spyExitPromise = new Promise(function(resolve, _reject) {
        spyExitResolve = resolve;
      });
      let spyExit = jest.spyOn(process, 'exit')
        .mockImplementation(function(...args) {
          spyExitResolve(args);
        });

      let expectedErr = new Error();
      let handler = async function(app, _e, _ctx) {
        app.use(function(_req, _res, _next) {
          throw expectedErr;
        });
      };

      let bHandler = express.bootstrap(handler, {
        pkg: {
          name: 'test'
        }
      });

      let e = {};
      let ctx = {};
      bHandler(e, ctx, _.noop);

      let exitArgs = await spyExitPromise;
      expect(exitArgs).toStrictEqual([
        1
      ]);

      expect(spyExit).toHaveBeenCalledTimes(1);
      spyExit.mockReset();
      spyExit.mockRestore();

      expect(spyMergeEnvCtx).toHaveBeenCalled();
      spyMergeEnvCtx.mockReset();
      spyMergeEnvCtx.mockRestore();
    });

    it("should call AWS' next with the (async) middleware's exception", async function() {
      let spyMergeEnvCtx = jest.spyOn(envCtx, 'merge')
        .mockImplementation(_.noop);

      let spyExitResolve;
      let spyExitPromise = new Promise(function(resolve, _reject) {
        spyExitResolve = resolve;
      });
      let spyExit = jest.spyOn(process, 'exit')
        .mockImplementation(function(...args) {
          spyExitResolve(args);
        });

      let expectedErr = new Error();
      let handler = async function(app, _e, _ctx) {
        app.use(async function(_req, _res, _next) {
          throw expectedErr;
        });
      };

      let bHandler = express.bootstrap(handler, {
        pkg: {
          name: 'test'
        }
      });

      let e = {};
      let ctx = {};
      bHandler(e, ctx, _.noop);

      let exitArgs = await spyExitPromise;
      expect(exitArgs).toStrictEqual([
        1
      ]);

      expect(spyExit).toHaveBeenCalledTimes(1);
      spyExit.mockReset();
      spyExit.mockRestore();

      expect(spyMergeEnvCtx).toHaveBeenCalled();
      spyMergeEnvCtx.mockReset();
      spyMergeEnvCtx.mockRestore();
    });

    it("should call AWS' next with the (async) middleware's ResponseError", function(done) {
      let spyMergeEnvCtx = jest.spyOn(envCtx, 'merge')
        .mockImplementation(_.noop);

      let expectedStatusCode = 404;
      let expectedDetails = {
        test: true
      };
      let handler = async function(app, _e, _ctx) {
        app.use(async function(_req, _res, _next) {
          throw new ResponseError(expectedStatusCode, expectedDetails);
        });
      };

      let bHandler = express.bootstrap(handler, {
        pkg: {
          name: 'test'
        }
      });

      let e = {};
      let ctx = {};

      bHandler(e, ctx, function(err, result) {
        expect(err).toBeUndefined();
        expect(result).toMatchObject({
          statusCode: expectedStatusCode,
          headers: {
            'content-type': 'application/problem+json; charset=utf-8'
          }
        });
        expect(JSON.parse(result.body)).toMatchObject(expectedDetails);

        expect(spyMergeEnvCtx).toHaveBeenCalled();
        spyMergeEnvCtx.mockReset();
        spyMergeEnvCtx.mockRestore();
        done();
      });
    });
  });
});
