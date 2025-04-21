import { genDFA } from './main.js';
import fs from 'fs';

let rules: {
  reg: string;
  handler: (text: string) => { yytext: string; type: string; value: string };
}[] = [
  {reg: '[ \t\n\r]+',handler: function (text) {return {yytext: text,type: 'space',value: text,};},}, //prettier-ignore
  {
    reg: `'(([^'\\\\])|(\\\\\\\\)|(\\\\'))*'`,
    handler: function (text) {
      return { yytext: text, type: 'string', value: text.slice(1, -1) };
    },
  },
];
function test() {
  let finished = false;
  let dfa = genDFA(rules.map((item) => item.reg));
  dfa.setSource(`'a\\\\' 'aa'`);
  dfa.endHandler = () => {
    finished = true;
    console.log('解析结束');
  };
  while (!finished) {
    let ret = dfa.run(rules.map((item) => item.handler));
    console.log(JSON.stringify(ret));
  }
}
test();
