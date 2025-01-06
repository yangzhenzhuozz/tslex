import { Automaton } from './automaton.js';
import { Grammar, default as TSCC } from 'tscc.js';
function main() {
  let grammar: Grammar = {
    tokens: ['ch', '[', ']', '-', '(', ')', '+', '*', '^', '{', '}', '|'],
    association: [{ nonassoc: ['+', '*'] }],
    BNF: [
      { 'exp:ch': {} },
      { 'exp:[ union_units ]': {} },
      { 'exp:[ ^ union_units ]': {} },
      { 'exp:( exp )': {} },
      { 'exp:exp exp': {} },
      { 'exp:exp | exp': {} },
      { 'exp:exp +': {} },
      { 'exp:exp *': {} },
      { 'union_units:union_units union_unit': {} },
      { 'union_units:union_unit': {} },
      { 'union_unit:ch': {} },
      { 'union_unit:range': {} },
      { 'range:ch - ch': {} },
      { 'S:ε': {} },
      { 'B:S S S': {} },
      { 'B:c': {} },
    ],
  };
}
main();
