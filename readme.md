# demo

```typescript
import { LexerRule } from './automaton.js';
import { genDFA } from './main.js';

let rules = [
  {
    reg: '"([^"]|(\\\\"))*"',
    handler: function (text) {
      console.log(`规则①成功解析到${text}`);
    },
  },
] as LexerRule[];
let dfa = genDFA(rules);
dfa.setSource('"abc\\""');
dfa.run();
```

输出

```
规则①成功解析到"abc\""
```
