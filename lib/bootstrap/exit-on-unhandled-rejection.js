'use strict';

process.on('unhandledRejection', function (err) {
  // eslint-disable-next-line no-console
  console.error(err);
  // eslint-disable-next-line no-process-exit
  process.exit(1);
});

//# sourceMappingURL=exit-on-unhandled-rejection.js.map