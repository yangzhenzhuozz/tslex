import { NFAAutomaton, AutomatonEdge, AutomatonNode } from './automaton.js';
import { Grammar, default as TSCC } from 'tscc-lr1';
import fs from 'fs';
import { assert } from './tools.js';
function gen() {
  let grammar: Grammar = {
    userCode: `import { NFAAutomaton,AutomatonEdge,AutomatonNode } from './automaton.js';\nimport { assert } from './tools.js';`,
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
    accept: function ($): NFAAutomaton {
      return $[0] as NFAAutomaton;
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
          action: function ($): NFAAutomaton {
            return $[0] as NFAAutomaton;
          },
        },
      },
      {
        'exp:exp exp': {
          priority: 'link',
          action: function ($): NFAAutomaton {
            let ret = <NFAAutomaton>$[0];
            ret.concatenate(<NFAAutomaton>$[1]);
            return ret;
          },
        },
      },
      {
        'exp:exp | exp': {
          action: function ($): NFAAutomaton {
            let ret = <NFAAutomaton>$[0];
            ret.union(<NFAAutomaton>$[2]);
            return ret;
          },
        },
      },
      {
        'exp:exp_unit +': {
          action: function ($): NFAAutomaton {
            let ret = (<NFAAutomaton>$[0]).clone();
            (<NFAAutomaton>$[0]).kleeneClosure();
            ret.concatenate(<NFAAutomaton>$[0]);
            return ret;
          },
        },
      }, //只允许一个表达式单元重复
      {
        'exp:exp_unit *': {
          action: function ($): NFAAutomaton {
            let ret = $[0] as NFAAutomaton;
            ret.kleeneClosure();
            return ret;
          },
        },
      }, //只允许一个表达式单元重复
      {
        'exp_unit:[ union_units ]': {
          action: function ($): NFAAutomaton {
            let edges = $[1] as AutomatonEdge[];
            assert(edges.length > 0, '[]里面必须有至少一个字符');
            let ret: NFAAutomaton | undefined = undefined;
            for (let edge of edges) {
              if (ret == undefined) {
                ret = new NFAAutomaton({ ch: [edge.start, edge.end] });
              } else {
                edge.target = [ret.end];
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
          action: function ($): NFAAutomaton {
            let edges = $[2] as AutomatonEdge[];
            assert(edges.length > 0, '^后面必须有至少一个字符');
            let tmpNode = new AutomatonNode(); //创建一个临时节点
            //处理完之后tmpNode的所有边都互不相交
            for (let edge of edges) {
              tmpNode.addEdge(edge);
            }

            let ret = new NFAAutomaton({
              nodes: [new AutomatonNode(), new AutomatonNode()],
            });
            let start = 0;
            for (let edge of tmpNode.edges.toArray()) {
              if (start < edge.start) {
                ret.start.addEdge(
                  new AutomatonEdge(start, edge.start - 1, [ret.end])
                );
              }
              start = edge.end + 1;
            }
            if (start < 0xffff) {
              ret.start.addEdge(new AutomatonEdge(start, 0xffff, [ret.end]));
            }
            //这时候的resultEdges就是我们需要的边了

            return ret;
          },
        },
      },
      {
        'exp_unit:ch': {
          action: function ($) {
            if ($[0] == -1) {
              return new NFAAutomaton({ ch: [0, 0xffff] });
            } else {
              return new NFAAutomaton({ ch: [$[0], $[0]] });
            }
          },
        },
      },
      {
        'exp_unit:( exp )': {
          action: function ($) {
            return $[1] as NFAAutomaton;
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
            let code: number;
            if ($[0] == -1) {
              code = '.'.charCodeAt(0);
            } else {
              code = $[0] as number;
            }
            return new AutomatonEdge(code, code, []);
          },
        },
      },
      {
        'union_unit:ch - ch': {
          action: function ($) {
            let code1: number;
            let code2: number;
            if ($[0] == -1) {
              code1 = '.'.charCodeAt(0);
            } else {
              code1 = $[0] as number;
            }
            if ($[2] == -1) {
              code2 = '.'.charCodeAt(0);
            } else {
              code2 = $[2] as number;
            }
            return new AutomatonEdge(code1, code2, []);
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
