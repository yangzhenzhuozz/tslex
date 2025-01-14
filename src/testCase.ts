import { LexerRule } from './automaton.js';
import { genDFA } from './main.js';

let rules: LexerRule<undefined>[] = [
  {
    reg: '"([^"]|(\\\\"))*"',
    handler: function (text) {
      console.log(`规则1成功解析到${text}`);
    },
  },
  {
    reg: '[0-9]+',
    handler: function (text) {
      console.log(`规则2成功解析到${text}`);
    },
  },
  {
    reg: 'a\\..c[a\\.]*',
    handler: function (text) {
      console.log(`规则2成功解析到${text}`);
    },
  },
];
function test() {
  let finished = false;
  let dfa = genDFA(rules);
  dfa.setSource('"abc\\""0123a..ca.');
  dfa.endHandler = () => {
    finished = true;
  };
  while (!finished) {
    dfa.run();
  }
}
test();
