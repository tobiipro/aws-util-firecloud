import _ from 'lodash-firecloud';
import firehose from '../src/firehose';

let generate = function({byteSize = 5} = {}) {
  return _.join(_.times(byteSize, function() {
    return _.random(35).toString(36);
  }), '');
};

// + 1 for the new line character
let byteSizeOverhead = Buffer.byteLength(JSON.stringify({content: ''})) + 1;

describe('firehose', function() {
  describe('putRecords', function() {
    test('should call _putRecordBatches', async function() {
      let byteSize = 25 - byteSizeOverhead;
      let records = _.times(1, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(firehose, '_putRecordBatches')
          .mockImplementation(async function() {
            throw new Error();
          })
          .mockImplementationOnce(async function({recordBatches}) {
            expect(recordBatches).toHaveLength(1);
            expect(recordBatches[0].Records).toHaveLength(1);
          });

      await firehose.putRecords({
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockReset();
      spy.mockRestore();
    });


    it(`should split record batches in chunks of ${firehose.batchRecordLimit} records,
when batch byteSize < ${firehose.batchByteSizeLimit / 1024 / 1024} MB`, async function() {
      let byteSize = 25 - byteSizeOverhead;
      let records = _.times(firehose.batchRecordLimit + 1, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(firehose, '_putRecordBatches')
          .mockImplementation(async function() {
            throw new Error();
          })
          .mockImplementationOnce(async function({recordBatches}) {
            expect(recordBatches).toHaveLength(2);
            expect(recordBatches[0].Records).toHaveLength(firehose.batchRecordLimit);
            expect(recordBatches[1].Records).toHaveLength(1);
          });

      await firehose.putRecords({
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockReset();
      spy.mockRestore();
    });


    it(`should split record batches in chunks of < ${firehose.batchByteSizeLimit / 1024 / 1024} MB records,
when batch count < ${firehose.batchRecordLimit}`, async function() {
      let byteSize = firehose.recordByteSizeLimit - byteSizeOverhead;
      let records = _.times(5, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(firehose, '_putRecordBatches')
          .mockImplementation(async function() {
            throw new Error();
          })
          .mockImplementationOnce(async function({recordBatches}) {
            expect(recordBatches).toHaveLength(2);
            expect(recordBatches[0].Records).toHaveLength(4);
            expect(recordBatches[1].Records).toHaveLength(1);
          });

      await firehose.putRecords({
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockReset();
      spy.mockRestore();
    });


    it(`cannot handle records larger than ${firehose.recordByteSizeLimit / 1024} KB`, async function() {
      let byteSize = firehose.recordByteSizeLimit - byteSizeOverhead + 1;
      let records = _.times(1, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(firehose, '_putRecordBatches')
          .mockImplementation(async function() {
            throw new Error();
          })
          .mockImplementationOnce(async function({recordBatches}) {
            expect(recordBatches).toHaveLength(0);
          });

      let spy2 = jest.fn()
          .mockImplementation(function() {
            throw new Error();
          })
          .mockImplementationOnce(function(...args) {
            expect(args[0]).toMatch(/Skipping record larger than/);
          });

      await firehose.putRecords({
        records,
        ctx: {
          log: {
            error: spy2
          }
        }
      });

      expect(spy).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();

      spy.mockReset();
      spy.mockRestore();
    });
  });
});
