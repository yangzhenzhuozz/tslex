import {
  AutomatonEdge,
  AutomatonNode,
  DFAAutomaton,
  DFAAutonSerializedData,
  NFAAutomaton,
} from './automaton.js';
import Parse, { YYTOKEN } from './parser.js';
import { Lex } from './parser.js';
/**
 * 这是用于解析正则表达式的词法分析器
 */
class Lexer implements Lex {
  private source: string;
  private pos = 0;
  private lastToken: string = '';
  constructor(src: string) {
    this.source = src;
  }
  yylex(): YYTOKEN {
    if (this.pos >= this.source.length) {
      return { type: '$', value: undefined, yytext: '' };
    }
    const createToken = (type: string, value: number): YYTOKEN => {
      this.lastToken = String.fromCharCode(value);
      return { type, value, yytext: String.fromCharCode(value) };
    };
    let c = this.source[this.pos];
    if (
      c === '(' ||
      c === ')' ||
      c === '[' ||
      c === ']' ||
      c === '-' ||
      c === '+' ||
      c === '*' ||
      c === '^' ||
      c === '|'
    ) {
      this.pos++;
      return createToken(c, c.charCodeAt(0));
    } else if (c === '.') {
      this.pos++;
      return createToken('ch', -1); //在parse针对-1单独处理，[]中的'\.'和'.'都等价于字符'.',外部的'\.'和'.'分别表示字符'.'和any
    } else {
      if (c == '\\') {
        this.pos++;
        switch (this.source[this.pos]) {
          case 'n':
            this.pos++;
            return createToken('ch', '\n'.charCodeAt(0));
          case 't':
            this.pos++;
            return createToken('ch', '\t'.charCodeAt(0));
          case '\\':
            this.pos++;
            return createToken('ch', '\\'.charCodeAt(0));
          case '+':
          case '-':
          case '^':
          case '*':
          case '|':
          case '.':
          case '(':
          case ')':
          case '[':
          case ']':
            c = this.source[this.pos];
            this.pos++;
            return createToken('ch', c.charCodeAt(0));
          case 'u':
            let code = parseInt(
              this.source.substring(this.pos + 1, this.pos + 5),
              16
            );
            this.pos += 5; //字母u和后面的4个unicode编码
            return createToken('ch', code);
          default:
            throw 'unkown escape';
        }
      } else {
        this.pos++;
        return createToken('ch', c.charCodeAt(0));
      }
    }
  }
  yyerror(msg: string) {
    console.error(`${msg}"${this.lastToken}"`);
  }
}
export function genDFA<T>(rules: string[]): DFAAutomaton {
  let NFAList: NFAAutomaton[] = [];
  for (let idx = 0; idx < rules.length; idx++) {
    let r = rules[idx];
    let lexer = new Lexer(r);
    let automaton = Parse(lexer) as NFAAutomaton;
    automaton.end.endHandler.push(idx);
    NFAList.push(automaton);
  }
  let finalNFAStart = new AutomatonNode();
  let finalNFAEnd = new AutomatonNode();
  for (let subNfa of NFAList) {
    finalNFAStart.addEdge(new AutomatonEdge(-1, -1, [subNfa.start]));
    subNfa.end.addEdge(new AutomatonEdge(-1, -1, [finalNFAEnd]));
  }
  let finalNFA = new NFAAutomaton({ nodes: [finalNFAStart, finalNFAEnd] });
  let dfa = finalNFA.toDFA();
  return dfa;
}
export function deserialize(serialized: DFAAutonSerializedData): DFAAutomaton {
  return DFAAutomaton.deserialize(serialized);
}
