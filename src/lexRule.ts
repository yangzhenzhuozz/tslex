import { LexerRule } from './automaton.js';

export default [
  {
    reg: 'b+',
    handler: function (text) {
      console.log(`规则②成功解析到${text}`);
    },
  },
  {
    reg: '[a-z]+',
    handler: function (text) {
      console.log(`规则①成功解析到${text}`);
    },
  },
] as LexerRule[];
