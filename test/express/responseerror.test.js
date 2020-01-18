import * as envCtx from '../../src/lambda/env-ctx';
import * as express from '../../src/express';
import ResponseError from '../../src/express/res-error';
import _ from 'lodash-firecloud';

describe('express', function() {
  describe('bootstrap', function() {
    it("should call AWS' next with the (async) middleware's ResponseError", async function() {
      let e = {
        httpMethod: 'GET',
        path: __filename
      };
      let ctx = {};

      let d = _.deferred();
      let spyEnvCtxMerge = jest.spyOn(envCtx, 'merge');
      // @ts-ignore
      spyEnvCtxMerge.mockImplementation(_.noop);

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
      // @ts-ignore
      bHandler(e, ctx, async function(err, result) {
        expect(err).toBeUndefined();
        expect(result).toMatchObject({
          statusCode: expectedStatusCode,
          headers: {
            'content-type': 'application/problem+json; charset=utf-8'
          }
        });
        expect(JSON.parse(result.body)).toMatchObject(expectedDetails);

        expect(spyEnvCtxMerge).toHaveBeenCalled();
        spyEnvCtxMerge.mockRestore();

        await ctx.log.flush();
        d.resolve();
      });

      await d.promise;
    });
  });
});
