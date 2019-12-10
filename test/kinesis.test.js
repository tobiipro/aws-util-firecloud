import * as kinesis from '../src/kinesis';
import _ from 'lodash-firecloud';

let generate = function({byteSize = 5} = {}) {
  return _.join(_.times(byteSize, function() {
    return _.random(35).toString(36);
  }), '');
};

let PartitionKey = 'undefined';

let byteSizeOverhead = Buffer.byteLength(JSON.stringify({
  Data: {
    content: ''
  },
  PartitionKey
}));

describe('kinesis', function() {
  describe('putRecords', function() {
    it('should call _putRecordBatches', async function() {
      let byteSize = 100;
      let records = _.times(1, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(kinesis, '_putRecordBatches');
      spy.mockImplementation(async function() {
        throw new Error();
      });
      spy.mockImplementationOnce(async function({recordBatches}) {
        expect(recordBatches).toHaveLength(1);
        expect(recordBatches[0].Records).toHaveLength(1);
        return _.sum(_.map(recordBatches, 'Records.length'));
      });

      await kinesis.putRecords({
        PartitionKey,
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });


    it(`should split record batches in chunks of ${kinesis.limits.batchRecord} records, \
when batch byteSize < ${kinesis.limits.batchByteSize / 1024 / 1024} MB`, async function() {
      let byteSize = 100;
      let records = _.times(kinesis.limits.batchRecord + 1, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(kinesis, '_putRecordBatches');
      spy.mockImplementation(async function() {
        throw new Error();
      });
      spy.mockImplementationOnce(async function({recordBatches}) {
        expect(recordBatches).toHaveLength(2);
        expect(recordBatches[0].Records).toHaveLength(kinesis.limits.batchRecord);
        expect(recordBatches[1].Records).toHaveLength(1);
        return _.sum(_.map(recordBatches, 'Records.length'));
      });

      await kinesis.putRecords({
        PartitionKey,
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });


    it(`should split record batches in chunks of < ${kinesis.limits.batchByteSize / 1024 / 1024} MB records, \
when batch count < ${kinesis.limits.batchRecord}`, async function() {
      let byteSize = kinesis.limits.recordByteSize - byteSizeOverhead;
      let maxRecordsInBatch = _.floor(kinesis.limits.batchByteSize / kinesis.limits.recordByteSize);
      let records = _.times(maxRecordsInBatch + 1, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(kinesis, '_putRecordBatches');
      spy.mockImplementation(async function() {
        throw new Error();
      });
      spy.mockImplementationOnce(async function({recordBatches}) {
        expect(recordBatches).toHaveLength(2);
        expect(recordBatches[0].Records).toHaveLength(maxRecordsInBatch);
        expect(recordBatches[1].Records).toHaveLength(1);
        return _.sum(_.map(recordBatches, 'Records.length'));
      });

      await kinesis.putRecords({
        PartitionKey,
        records
      });

      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });


    it(`cannot handle records larger than ${kinesis.limits.recordByteSize / 1024} KB`, async function() {
      let byteSize = kinesis.limits.recordByteSize - byteSizeOverhead + 1;
      let records = _.times(1, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(kinesis, '_putRecordBatches');
      spy.mockImplementation(async function() {
        throw new Error();
      });
      spy.mockImplementationOnce(async function({recordBatches}) {
        expect(recordBatches).toHaveLength(0);
        return _.sum(_.map(recordBatches, 'Records.length'));
      });

      let spy2 = jest.fn();
      spy2.mockImplementation(function() {
        throw new Error();
      });
      spy2.mockImplementationOnce(function(...args) {
        expect(args[1]).toMatch(/Skipping record larger than/);
      });

      await kinesis.putRecords({
        PartitionKey,
        records,
        ctx: {
          log: {
            error: spy2
          }
        }
      });

      expect(spy).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();

      spy.mockRestore();
    });


    it("should make sure number of records 'in' match number of records 'out'", async function() {
      let byteSize = kinesis.limits.recordByteSize - byteSizeOverhead + 1;
      let records = _.times(5, function() {
        return {
          content: generate({byteSize})
        };
      });

      let spy = jest.spyOn(kinesis, '_putRecordBatches');
      spy.mockImplementation(async function() {
        throw new Error();
      });
      spy.mockImplementationOnce(async function() {
        return records.length - 1; // one missing
      });

      let failed = false;
      try {
        await kinesis.putRecords({
          PartitionKey,
          records
        });
      } catch (_err) {
        failed = true;
      }

      expect(failed).toBe(true);

      spy.mockRestore();
    });
  });
});
