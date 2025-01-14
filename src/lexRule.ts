import { LexerRule } from './automaton.js';
import { genDFA } from './main.js';

let rules: LexerRule<undefined>[] = [
  {
    reg: '"([^"]|(\\\\"))*"',
    handler: function (text) {
      console.log(`规则①成功解析到${text}`);
    },
  },
];
let dfa = genDFA(rules);
dfa.setSource('"abc\\""');
dfa.run();
