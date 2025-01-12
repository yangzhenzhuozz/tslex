import {
  AutomatonEdge,
  AutomatonNode,
  DFAAutomaton,
  NFAAutomaton,
} from './automaton.js';
import Parse, { YYTOKEN } from './parser.js';
import { Lex } from './parser.js';
import rule from './lexRule.js';
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
      c === '|' ||
      c === '-'
    ) {
      this.pos++;
      return createToken(c, c.charCodeAt(0));
    } else {
      if (c == '\\') {
        this.pos++;
        switch (this.source[this.pos]) {
          case 'n':
            return createToken('ch', '\n'.charCodeAt(0));
          case 't':
            return createToken('ch', '\t'.charCodeAt(0));
          case '\\':
            return createToken('ch', '\\'.charCodeAt(0));
          case 'u':
            let code = parseInt(
              this.source.substring(this.pos + 1, this.pos + 5),
              16
            );
            this.pos += 4;
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
function main() {
  let NFAList = [] as NFAAutomaton[];
  for (let r of rule) {
    let lexer = new Lexer(r.reg);
    let automaton = Parse(lexer) as NFAAutomaton;
    automaton.end.endHandler.push(r.handler!);
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
  let serialized = dfa.serialize();
  let realDFA = DFAAutomaton.deserialize(serialized);
  realDFA.setSource('b');
  realDFA.run();
}
main();
