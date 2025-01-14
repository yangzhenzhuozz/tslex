import { LexerRule } from './automaton.js';
import { genDFA } from './main.js';

let rules: LexerRule<any>[] = [
  {reg: '[ \t\n\r]+',handler: function (text) {return {yytext: 'space',type: 'space',value: text,};},}, //prettier-ignore
  {reg: 'from',handler: function (text) {return {yytext: 'from',type: text,value: text,};},}, // prettier-ignore
  {reg: 'select',handler: function (text) {return {yytext: 'select',type: text,value: text,};},}, // prettier-ignore
  {reg: 'where',handler: function (text) {return {yytext: 'where',type: text,value: text,};},}, // prettier-ignore
  {reg: ',',handler: function (text) {return {yytext: ',',type: text,value: text,};},}, // prettier-ignore
  {reg: 'as',handler: function (text) {return {yytext: 'as',type: text,value: text,};},}, // prettier-ignore
  {reg: '\\+',handler: function (text) {return {yytext: '\\+',type: text,value: text,};},}, // prettier-ignore
  {reg: '\\-',handler: function (text) {return {yytext: '\\-',type: text,value: text,};},}, // prettier-ignore
  {reg: '\\*',handler: function (text) {return {yytext: '\\*',type: text,value: text,};},}, // prettier-ignore
  {reg: '/',handler: function (text) {return {yytext: '/',type: text,value: text,};},}, // prettier-ignore
  {reg: '\\(',handler: function (text) {return {yytext: '\\(',type: text,value: text,};},}, // prettier-ignore
  {reg: '\\)',handler: function (text) {return {yytext: '\\)',type: text,value: text,};},}, // prettier-ignore
  {reg: 'if',handler: function (text) {return {yytext: 'if',type: text,value: text,};},}, // prettier-ignore
  {reg: 'then',handler: function (text) {return {yytext: 'then',type: text,value: text,};},}, // prettier-ignore
  {reg: 'else',handler: function (text) {return {yytext: 'else',type: text,value: text,};},}, // prettier-ignore
  {reg: 'elseif',handler: function (text) {return {yytext: 'elseif',type: text,value: text,};},}, // prettier-ignore
  {reg: 'end',handler: function (text) {return {yytext: 'end',type: text,value: text,};},}, // prettier-ignore
  {reg: 'and',handler: function (text) {return {yytext: 'and',type: text,value: text,};},}, // prettier-ignore
  {reg: 'or',handler: function (text) {return {yytext: 'or',type: text,value: text,};},}, // prettier-ignore
  {reg: 'order',handler: function (text) {return {yytext: 'order',type: text,value: text,};},}, // prettier-ignore
  {reg: 'group',handler: function (text) {return {yytext: 'group',type: text,value: text,};},}, // prettier-ignore
  {reg: 'by',handler: function (text) {return {yytext: 'by',type: text,value: text,};},}, // prettier-ignore
  {reg: 'asc',handler: function (text) {return {yytext: 'asc',type: text,value: text,};},}, // prettier-ignore
  {reg: 'desc',handler: function (text) {return {yytext: 'desc',type: text,value: text,};},}, // prettier-ignore
  {reg: 'having',handler: function (text) {return {yytext: 'having',type: text,value: text,};},}, // prettier-ignore
  {reg: 'limit',handler: function (text) {return {yytext: 'limit',type: text,value: text,};},}, // prettier-ignore
  // prettier-ignore
  {reg: '[a-z][a-zA-Z0-9]*',handler: function (text) {return {yytext: text,type: 'id',value: text,};},}, //id的优先级最低,避免把关键字识别成id
  {
    reg: '[0-9]+.[0-9]+',
    handler: function (text) {
      return { yytext: text, type: 'number', value: Number(text) };
    },
  },
  {
    reg: '"([^"]|(\\\\"))*"',
    handler: function (text) {
      return { yytext: text, type: 'string', value: text.slice(1, -1) };
    },
  },
];
function test() {
  let finished = false;
  let dfa = genDFA(rules);
  dfa.setSource('from a select a,b,d');
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
