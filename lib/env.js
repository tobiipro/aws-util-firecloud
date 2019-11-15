"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = exports.env = exports.current = exports.envProxy = void 0;var _lodashFirecloud = _interopRequireDefault(require("lodash-firecloud"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

// FIXME backward compat
let envProxy = _lodashFirecloud.default.safeProxy;exports.envProxy = envProxy;

let current = _lodashFirecloud.default.safeProxy(process.env);

// FIXME backward compat alias
exports.current = current;let env = exports.current;exports.env = env;var _default = exports.current;exports.default = _default;

//# sourceMappingURL=env.js.map