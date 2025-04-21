import { LexerRule } from './automaton.js';
import { genDFA } from './main.js';
import fs from 'fs';

let rules: LexerRule<any>[] = [
  {reg: '[ \t\n\r]+',handler: function (text) {return {yytext: text,type: 'space',value: text,};},}, //prettier-ignore
  {
    reg: `'(([^'\\\\])|(\\\\)|(\\\\')|(\\\\t)|(\\\\n)|(\\\\r)|(\\\\b)|(\\\\f))*'`,
    handler: function (text) {
      return { yytext: text, type: 'string', value: text.slice(1, -1) };
    },
  },
];
function test() {
  let finished = false;
  let dfa = genDFA(rules);
  dfa.setSource(fs.readFileSync('test.txt').toString());
  dfa.endHandler = () => {
    finished = true;
    console.log('解析结束');
  };
  while (!finished) {
    let ret = dfa.run();
    console.log(JSON.stringify(ret));
  }
}
test();
