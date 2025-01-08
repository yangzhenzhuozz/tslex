import { Automaton, AutomatonEdge } from './automaton.js';
import { Grammar, default as TSCC } from 'tscc';
import fs from 'fs';
import { assert } from './tools.js';
class Lexical {}
function gen() {
  let grammar: Grammar = {
    userCode: `import { Automaton,AutomatonEdge } from './automaton.js';\nimport { assert } from './tools.js';`,
    tokens: ['ch', '[', ']', '-', '(', ')', '+', '*', '^', '{', '}', '|'],
    association: [
      { nonassoc: ['('] },
      { nonassoc: ['['] },
      { nonassoc: ['-'] },
      { nonassoc: ['+', '*'] },
      { left: ['link'] },
      { left: ['|'] },
      { nonassoc: ['ch'] },
    ],
    accept: function ($): Automaton {
      console.log('解析完毕');
      return $[0] as Automaton;
    },
    /*
     BNF: [
        { 'exp:exp_unit': {} },
        { 'exp:exp exp': { priority: 'link' } },
        { 'exp:exp | exp': {} },
        { 'exp:exp_unit +': {} }, //只允许一个表达式单元重复
        { 'exp:exp_unit *': {} }, //只允许一个表达式单元重复
        { 'exp_unit:[ union_units ]': {} },
        { 'exp_unit:[ ^ union_units ]': {} },
        { 'exp_unit:ch': {} },
        { 'exp_unit:( exp )': {} },
        { 'union_units:union_units union_unit': {} },
        { 'union_units:union_unit': {} },
        { 'union_unit:ch': {} },
        { 'union_unit:ch - ch': {} },
      ]
     */
    BNF: [
      {
        'exp:exp_unit': {
          action: function ($): Automaton {
            return $[0] as Automaton;
          },
        },
      },
      {
        'exp:exp exp': {
          priority: 'link',
          action: function ($): Automaton {
            let ret = <Automaton>$[0];
            ret.concatenate(<Automaton>$[1]);
            return ret;
          },
        },
      },
      {
        'exp:exp | exp': {
          action: function ($): Automaton {
            let ret = <Automaton>$[0];
            ret.union(<Automaton>$[2]);
            return ret;
          },
        },
      },
      {
        'exp:exp_unit +': {
          action: function ($): Automaton {
            let ret = (<Automaton>$[0]).clone();
            (<Automaton>$[0]).kleeneClosure();
            ret.concatenate(<Automaton>$[0]);
            return ret;
          },
        },
      }, //只允许一个表达式单元重复
      {
        'exp:exp_unit *': {
          action: function ($): Automaton {
            let ret = $[0] as Automaton;
            ret.kleeneClosure();
            return ret;
          },
        },
      }, //只允许一个表达式单元重复
      {
        'exp_unit:[ union_units ]': {
          action: function ($): Automaton {
            let edges = $[1] as AutomatonEdge[];
            assert(edges.length > 0, '[]里面必须有至少一个字符');
            let ret: Automaton | undefined = undefined;
            for (let edge of edges) {
              if (ret == undefined) {
                ret = new Automaton({ ch: [edge.start, edge.end] });
              } else {
                ret.start.addEdge(edge);
              }
            }
            assert(ret != undefined);
            return ret;
          },
        },
      },
      {
        'exp_unit:[ ^ union_units ]': {
          action: function ($): Automaton {
            let edges = $[2] as AutomatonEdge[];
            assert(edges.length > 0, '^后面必须有至少一个字符');
            let ret: Automaton | undefined = undefined;
            for (let edge of edges) {
              for (let tmp of edge.not()) {
                if (ret == undefined) {
                  ret = new Automaton({ ch: [tmp.start, tmp.end] });
                } else {
                  ret.start.addEdge(tmp);
                }
              }
            }
            assert(ret != undefined);
            return ret;
          },
        },
      },
      {
        'exp_unit:ch': {
          action: function ($) {
            return new Automaton({ ch: [$[0], $[0]] });
          },
        },
      },
      {
        'exp_unit:( exp )': {
          action: function ($) {
            return $[1] as Automaton;
          },
        },
      },
      {
        'union_units:union_units union_unit': {
          action: function ($) {
            return [...$[0], $[1]];
          },
        },
      },
      {
        'union_units:union_unit': {
          action: function ($) {
            return [<AutomatonEdge>$[0]];
          },
        },
      },
      {
        'union_unit:ch': {
          action: function ($) {
            return new AutomatonEdge($[0] as number, $[0] as number, []);
          },
        },
      },
      {
        'union_unit:ch - ch': {
          action: function ($) {
            return new AutomatonEdge($[0] as number, $[2] as number, []);
          },
        },
      },
    ],
  };
  let tscc = new TSCC(grammar, { debug: false, language: 'zh-cn' });
  let compilerSorce = tscc.generate();
  fs.writeFileSync('src/parser.ts', compilerSorce!);
}
gen();
