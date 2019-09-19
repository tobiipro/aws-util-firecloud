"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.inspect = exports._diffInspection = exports._tryInvoke = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));
var _os = _interopRequireDefault(require("os"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

let _tryInvoke = function (fn) {
  if (!_lodashFirecloud.default.isFunction(fn)) {
    return;
  }

  try {
    return fn();
  } catch (_err) {
    // ignore
  }
};exports._tryInvoke = _tryInvoke;

let _diffInspection = function (inspection, previousInspection, path) {
  return _lodashFirecloud.default.get(inspection, path) - _lodashFirecloud.default.get(previousInspection, path);
};exports._diffInspection = _diffInspection;

let inspect = async function ({ ctx }) {
  if (!ctx.log._canTrace) {
    return;
  }

  let processSnapshot = _lodashFirecloud.default.pick(process, [
  'arch',
  'argv',
  'argv0',
  'config',
  'env',
  'execArgv',
  'pid',
  'platform',
  'release',
  'title',
  'version',
  'versions']);

  _lodashFirecloud.default.merge(processSnapshot, _lodashFirecloud.default.mapValues(_lodashFirecloud.default.pick(process, [
  'cpuUsage',
  'memoryUsage',
  'uptime']), exports._tryInvoke));


  let osSnapshot = _lodashFirecloud.default.mapValues(_lodashFirecloud.default.omit(_os.default, [
  // silence DeprecatedWarnings
  'getNetworkInterfaces',
  'tmpDir']), exports._tryInvoke);


  let inspection = JSON.parse(JSON.stringify({
    process: processSnapshot,
    os: osSnapshot }));


  let {
    previousInspection } =
  inspect;
  inspect.previousInspection = inspection;

  if (previousInspection) {
    inspection.cpuUsageDiff = _lodashFirecloud.default.reduce([
    'user',
    'system'],
    function (acc, key) {
      acc[key] = exports._diffInspection(inspection, previousInspection, `process.cpuUsage.${key}`);
      return acc;
    }, {});

    inspection.memoryUsageDiff = _lodashFirecloud.default.reduce([
    'heapUsed',
    'rss'],
    function (acc, key) {
      acc[key] = exports._diffInspection(inspection, previousInspection, `process.memoryUsage.${key}`);
      return acc;
    }, {});
  }

  for (let key in inspection) {
    await (async createError => {try {return await ctx.log.trace({ _babelSrc: { file: typeof __filename === "undefined" ? "src/lambda/inspect.js" : __filename, babelFile: "src/lambda/inspect.js", line: 80, column: 11 } }, `Inspecting '${key}'`, inspection[key]);} catch (_awaitTraceErr) {let err = createError();_awaitTraceErr.stack += "\n...\n" + err.stack;throw _awaitTraceErr;}})(() => new Error());
  }
};exports.inspect = inspect;var _default = exports.inspect;exports.default = _default;

//# sourceMappingURL=inspect.js.map