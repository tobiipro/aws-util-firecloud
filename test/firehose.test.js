import _ from 'lodash-firecloud';
import firehose from '../lib/firehose';

let generate = function({byteSize = 5} = {}) {
  return _.join(_.times(byteSize, function() {
    return _.random(35).toString(36);
  }), '');
};

let byteSizeOverhead = Buffer.byteLength(JSON.stringify({
  content: ''
}));
// + 1 for the new line character
byteSizeOverhead = byteSizeOverhead + 1;

describe('firehose', function() {
  describe('putRecords', function() {
    it('should call _putRecordBatches', async function() {
      let byteSize = 100;
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
            return _.sum(_.map(recordBatches, 'Records.length'));
          });

      await firehose.putRecords({
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockReset();
      spy.mockRestore();
    });


    it(`should split record batches in chunks of ${firehose.limits.batchRecord} records, \
when batch byteSize < ${firehose.limits.batchByteSize / 1024 / 1024} MB`, async function() {
      let byteSize = 100;
      let records = _.times(firehose.limits.batchRecord + 1, function() {
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
            expect(recordBatches[0].Records).toHaveLength(firehose.limits.batchRecord);
            expect(recordBatches[1].Records).toHaveLength(1);
            return _.sum(_.map(recordBatches, 'Records.length'));
          });

      await firehose.putRecords({
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockReset();
      spy.mockRestore();
    });


    it(`should split record batches in chunks of < ${firehose.limits.batchByteSize / 1024 / 1024} MB records, \
when batch count < ${firehose.limits.batchRecord}`, async function() {
      let byteSize = firehose.limits.recordByteSize - byteSizeOverhead;
      let maxRecordsInBatch = _.floor(firehose.limits.batchByteSize / firehose.limits.recordByteSize);
      let records = _.times(maxRecordsInBatch + 1, function() {
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
            expect(recordBatches[0].Records).toHaveLength(maxRecordsInBatch);
            expect(recordBatches[1].Records).toHaveLength(1);
            return _.sum(_.map(recordBatches, 'Records.length'));
          });

      await firehose.putRecords({
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockReset();
      spy.mockRestore();
    });


    it(`cannot handle records larger than ${firehose.limits.recordByteSize / 1024} KB`, async function() {
      let byteSize = firehose.limits.recordByteSize - byteSizeOverhead + 1;
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
            return _.sum(_.map(recordBatches, 'Records.length'));
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


    it(`should make sure number of records 'in' match number of records 'out'`, async function() {
      let byteSize = firehose.limits.recordByteSize - byteSizeOverhead + 1;
      let records = _.times(5, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(firehose, '_putRecordBatches')
          .mockImplementation(async function() {
            throw new Error();
          })
          .mockImplementationOnce(async function() {
            return records.length - 1; // one missing
          });

      let failed = false;
      try {
        await firehose.putRecords({
          records
        });
      } catch (_err) {
        failed = true;
      }

      expect(failed).toBeTruthy();

      spy.mockReset();
      spy.mockRestore();
    });
  });
});
