import { RBTree } from './RBTree.js';
import { assert } from './tools.js';

/**
 * -1表示any,-2表示永远匹配不到
 */
export class AutomatonEdge {
  public start: number;
  public end: number;
  public target: AutomatonNode[];
  public constructor(start: number, end: number, target: AutomatonNode[]) {
    if (start == -1 || end == -1) {
      if (start != -1 || end != -1) {
        throw 'end 和 start 必须同时为0';
      }
    }
    if (end < start) {
      throw 'end必须不小于start';
    }
    this.start = start;
    this.end = end;
    this.target = target;
  }
  public separate(other: AutomatonEdge): AutomatonEdge[] {
    let ret: AutomatonEdge[] = [];
    let cmp = AutomatonEdge.compare(this, other);
    if (cmp < 0 || cmp > 0) {
      ret = [
        new AutomatonEdge(this.start, this.end, this.target),
        new AutomatonEdge(other.start, other.end, other.target),
      ];
    } else if (this.start < other.start && this.end > other.end) {
      ret = [
        new AutomatonEdge(this.start, other.start - 1, this.target),
        new AutomatonEdge(other.start, other.end, [
          ...this.target,
          ...other.target,
        ]),
        new AutomatonEdge(other.end + 1, this.end, this.target),
      ];
    } else if (this.start > other.start && this.end < other.end) {
      ret = [
        new AutomatonEdge(other.start, this.start - 1, other.target),
        new AutomatonEdge(this.start, this.end, [
          ...this.target,
          ...other.target,
        ]),
        new AutomatonEdge(this.end + 1, other.end, other.target),
      ];
    } else if (this.start === other.start && this.end === other.end) {
      ret = [
        new AutomatonEdge(this.start, this.end, [
          ...this.target,
          ...other.target,
        ]),
      ];
    } else if (this.start === other.start) {
      if (this.end < other.end) {
        ret = [
          new AutomatonEdge(this.start, this.end, [
            ...this.target,
            ...other.target,
          ]),
          new AutomatonEdge(this.end + 1, other.end, other.target),
        ];
      } else {
        ret = [
          new AutomatonEdge(this.start, other.end, [
            ...this.target,
            ...other.target,
          ]),
          new AutomatonEdge(other.end + 1, this.end, this.target),
        ];
      }
    } else if (this.end === other.end) {
      if (this.start < other.start) {
        ret = [
          new AutomatonEdge(this.start, other.start - 1, this.target),
          new AutomatonEdge(other.start, this.end, [
            ...this.target,
            ...other.target,
          ]),
        ];
      } else {
        ret = [
          new AutomatonEdge(other.start, this.start - 1, other.target),
          new AutomatonEdge(this.start, this.end, [
            ...this.target,
            ...other.target,
          ]),
        ];
      }
    } else {
      throw new Error('不可能出现的情况');
    }

    assert(ret.length != 0);
    return ret;
  }
  public not(): AutomatonEdge[] {
    if (this.start == 0 && this.end == 0xffff) {
      //-2永远不会被匹配
      return [new AutomatonEdge(-2, -2, this.target)];
    }
    if (this.start == 0) {
      return [new AutomatonEdge(this.end + 1, 0xffff, this.target)];
    }
    if (this.end == 0xffff) {
      return [new AutomatonEdge(0, this.start - 1, this.target)];
    }
    return [
      new AutomatonEdge(0, this.start - 1, this.target),
      new AutomatonEdge(this.end + 1, 0xffff, this.target),
    ];
  }
  public static compare(a: AutomatonEdge, b: AutomatonEdge): number {
    if (a.end < b.start) return -1;
    else if (a.start > b.end) return 1;
    else return 0;
  }
  public toString(): string {
    return `(${this.start}, ${this.end})=>[${this.target
      .map((item) => item.idx)
      .join(',')}]`;
  }
}

export class AutomatonNode {
  static counter = 0;
  public idx: number;
  public edges: RBTree<AutomatonEdge>;
  public endHandler: ((arg: string) => any)[] = [];
  public constructor() {
    this.idx = AutomatonNode.counter;
    AutomatonNode.counter++;
    this.edges = new RBTree(AutomatonEdge.compare);
  }
  public addEdge(edge: AutomatonEdge) {
    let corssEdge = this.edges.find(edge);
    if (corssEdge) {
      /**
       * 如果有交叉的边，就把这两条边分开
       * 先把交叉的边删除
       * 然后把这两条边拆分成多条边
       * 递归把所有冲突全部解决
       */
      this.edges.remove(corssEdge);
      let separatedEdges = corssEdge.separate(edge);
      for (let e of separatedEdges) {
        this.addEdge(e);
      }
    } else {
      this.edges.add(edge);
    }
  }

  /**
   * 计算给定节点数组的闭包。
   *
   * 该方法会遍历所有节点及其边，找到所有可以通过ε边（start为-1的边）到达的节点，
   * 并将这些节点加入结果集中。
   *
   * @param arr 初始节点数组
   * @returns 闭包节点数组
   */
  public static closure(arr: AutomatonNode[]): AutomatonNode[] {
    let set = new RBTree<AutomatonNode>((a, b) => a.idx - b.idx);
    let fifo = [] as AutomatonNode[];
    for (let n of arr) {
      set.add(n);
      fifo.push(n);
    }
    while (fifo.length > 0) {
      let node = fifo.shift();
      if (node !== undefined) {
        for (let edge of node.edges.toArray()) {
          if (edge.start === -1) {
            for (let t of edge.target) {
              if (!set.has(t)) {
                set.add(t);
                fifo.push(t);
              }
            }
          }
        }
      }
    }
    return set.toArray().sort((a, b) => a.idx - b.idx);
  }

  public static test() {
    //通过修改a,b的区间来测试，覆盖Edge的所有separate情况
    // let node = new AutomatonNode();
    // let a = new AutomatonEdge(10, 20, []);
    // let b = new AutomatonEdge(11, 20, []);
    // node.addEdge(a);
    // node.addEdge(b);

    //测试闭包
    let a = new AutomatonNode();
    let b = new AutomatonNode();
    let c = new AutomatonNode();
    a.addEdge(new AutomatonEdge(-1, -1, [c]));
    b.addEdge(new AutomatonEdge(-1, -1, [c]));
    let ret = AutomatonNode.closure([a, a, a, a]);
    debugger;
  }
}

export class NFAAutomaton {
  public start: AutomatonNode;
  public end: AutomatonNode;
  public constructor(param: {
    ch?: [number, number];
    nodes?: [AutomatonNode, AutomatonNode];
  }) {
    if (param.ch) {
      this.start = new AutomatonNode();
      this.end = new AutomatonNode();
      this.start.addEdge(
        new AutomatonEdge(param.ch[0], param.ch[1], [this.end])
      );
    } else if (param.nodes) {
      this.start = param.nodes[0];
      this.end = param.nodes[1];
    } else {
      throw 'error';
    }
  }
  /**
   * 这段注释是copilot生成的注释，比我自己理解的更透彻
   *
   * 克隆当前的自动机，生成一个新的自动机实例。
   *
   * 该方法首先创建新的起始节点和结束节点，并初始化一个分析过的节点映射表 `analyzed`，
   * 其中包含当前自动机的起始节点和结束节点。然后使用一个先进先出的队列 `fifo` 来遍历
   * 当前自动机的所有节点。
   *
   * 在遍历过程中，对于每一个节点的每一条边，检查边的目标节点是否已经被分析过。如果
   * 没有被分析过，则将目标节点加入队列 `fifo` 并在 `analyzed` 映射表中创建一个新的
   * 对应节点。然后，将当前节点的边添加到新的节点中。
   *
   * 最后，返回一个包含新起始节点和新结束节点的新的自动机实例。
   *
   * @returns {NFAAutomaton} 新的自动机实例
   */
  public clone(): NFAAutomaton {
    let newStart = new AutomatonNode();
    let newEnd = new AutomatonNode();
    let analyzed: { [key: number]: AutomatonNode } = {
      [this.start.idx]: newStart,
      [this.end.idx]: newEnd,
    };
    let fifo: AutomatonNode[] = [this.start];
    for (; fifo.length > 0; ) {
      let node = fifo.shift();
      if (node == undefined) {
        break;
      } else {
        //遍历当前状态的边
        for (let edge of node.edges.toArray()) {
          //遍历边的可达状态
          for (let target of edge.target) {
            //还没有分析过
            if (analyzed[target.idx] == undefined) {
              fifo.push(target);
              analyzed[target.idx] = new AutomatonNode();
            }
            analyzed[node.idx].addEdge(
              new AutomatonEdge(edge.start, edge.end, [analyzed[target.idx]])
            );
          }
        }
      }
    }
    return new NFAAutomaton({
      nodes: [newStart, newEnd],
    });
  }
  public kleeneClosure() {
    let newStart = new AutomatonNode();
    let newEnd = new AutomatonNode();
    newStart.addEdge(new AutomatonEdge(-1, -1, [this.start, newEnd]));
    this.end.addEdge(new AutomatonEdge(-1, -1, [this.start, newEnd]));
    this.start = newStart;
    this.end = newEnd;
  }
  public concatenate(automaton: NFAAutomaton) {
    this.end.addEdge(new AutomatonEdge(-1, -1, [automaton.start]));
    this.end = automaton.end;
  }
  public union(automaton: NFAAutomaton) {
    let newStart = new AutomatonNode();
    newStart.addEdge(new AutomatonEdge(-1, -1, [this.start, automaton.start]));
    let newEnd = new AutomatonNode();
    this.end.addEdge(new AutomatonEdge(-1, -1, [newEnd]));
    automaton.end.addEdge(new AutomatonEdge(-1, -1, [newEnd]));
    this.start = newStart;
    this.end = newEnd;
  }

  /**
   * 将当前NFA自动机转换为DFA自动机。
   *
   * 该方法首先创建一个节点集合缓存 `nodeSetCache`，用于存储已分析的状态集合。
   * 然后定义一个函数 `sign`，用于生成状态集合的唯一标识符。
   *
   * 接着，计算起始状态的闭包 `startSet`，并创建对应的DFA起始节点 `dfaStart`。
   * 将起始状态集合及其对应的DFA节点存入缓存，并将起始状态集合加入待分析队列 `fifo`。
   *
   * 在遍历待分析队列时，对于每一个NFA状态集合，获取其对应的DFA状态节点。
   * 然后遍历该集合中的每个节点的边，将所有非ε边添加到当前DFA状态节点中。
   *
   * 接着，清空当前DFA状态节点的边，并重新计算目标状态集合的闭包。
   * 如果目标状态集合不在缓存中，则创建新的DFA状态节点，并将其存入缓存和待分析队列。
   * 最后，将边添加到当前DFA状态节点中。
   *
   * 返回包含DFA起始节点的DFA自动机实例。
   *
   * @returns {DFAAutomaton} 转换后的DFA自动机实例
   */
  public toDFA(): DFAAutomaton {
    let nodeSetCache = new Map<string, AutomatonNode>();
    let sign = (arr: AutomatonNode[]): string => {
      return arr
        .sort((a, b) => a.idx - b.idx)
        .map((item) => String(item.idx))
        .join(',');
    };

    let startSet = AutomatonNode.closure([this.start]);
    let dfaStart = new AutomatonNode();
    for (let set of startSet) {
      for (let handler of set.endHandler) {
        dfaStart.endHandler.push(handler);
      }
    }
    nodeSetCache.set(sign(startSet), dfaStart);
    let fifo: AutomatonNode[][] = [startSet]; //待分析的状态集

    while (fifo.length > 0) {
      let nowNFAStatSet = fifo.shift();
      assert(nowNFAStatSet != undefined);
      let nowDFAstate = nodeSetCache.get(sign(nowNFAStatSet)); //cache中一定有
      assert(nowDFAstate != undefined);

      //把set中的边都添加到nowStat中,这里利用了addEdge函数会自动拆分边的特点获取到目标状态集合
      for (let node of nowNFAStatSet) {
        for (let edge of node.edges.toArray()) {
          for (let t of edge.target) {
            if (edge.start != -1) {
              //把所有非ε边的目标添加到targetSet
              nowDFAstate.addEdge(new AutomatonEdge(edge.start, edge.end, [t]));
            }
          }
        }
      }

      let allEdges = nowDFAstate.edges.toArray();
      nowDFAstate.edges = new RBTree(AutomatonEdge.compare); //把之前添加的边清空

      for (let edge of allEdges) {
        let targetNFAStateSet = AutomatonNode.closure(edge.target);
        let signature = sign(targetNFAStateSet);

        if (!nodeSetCache.has(signature)) {
          let endHandlers = [];
          //把所有的endHandler放到目标状态,因为closure函数已经进行了排序,所以先创建的NFA会排在前面
          for (let s of targetNFAStateSet) {
            endHandlers.push(...s.endHandler);
          }
          let newDFAState = new AutomatonNode();
          newDFAState.endHandler = endHandlers;
          nodeSetCache.set(signature, newDFAState);
          fifo.push(targetNFAStateSet);
        }
        nowDFAstate.addEdge(
          new AutomatonEdge(edge.start, edge.end, [
            nodeSetCache.get(signature)!,
          ])
        );
      }
    }
    return new DFAAutomaton(dfaStart);
  }

  //测试代码
  public static testClone() {
    let a = new NFAAutomaton({ ch: [99, 99] });
    a.kleeneClosure();
    let n = a.clone();
    debugger;
  }
}
interface DFAAutonSerializedDatum {
  edges: {
    start: number;
    end: number;
    target: number;
  }[];
  handlers: string[];
}
export type DFAAutonSerializedData = DFAAutonSerializedDatum[];
export class DFAAutomaton {
  private pos = 0;
  private source: string = '';
  public start: AutomatonNode;
  public endHandler: (() => any) | undefined;
  public constructor(start: AutomatonNode) {
    this.start = start;
  }
  public setSource(src: string) {
    this.source = src;
  }
  public run() {
    if (this.pos >= this.source.length) {
      if (this.endHandler) {
        return this.endHandler();
      }
    } else {
      let strLen = 0;
      let nowState = this.start;
      let lastState = nowState;
      for (;;) {
        lastState = nowState;
        //这里读取到了EOF(end of file)
        if (this.pos + strLen >= this.source.length) {
          break;
        }
        let ch = this.source[this.pos + strLen];
        let code = ch.charCodeAt(0);
        let edge = nowState.edges.find(new AutomatonEdge(code, code, []));
        if (edge != undefined) {
          nowState = edge.target[0];
          strLen++;
        } else {
          break;
        }
      }
      if (lastState.endHandler.length > 0) {
        let ret = lastState.endHandler[0](
          this.source.substring(this.pos, this.pos + strLen)
        );
        this.pos += strLen;
        return ret;
      } else {
        throw `无法识别的字符${this.source[this.pos]}`;
      }
    }
  }
  public static deserialize(data: DFAAutonSerializedData): DFAAutomaton {
    let nodes: AutomatonNode[] = [];
    for (let i = 0; i < data.length; i++) {
      let node = new AutomatonNode();
      nodes.push(node);
      for (let handler of data[i].handlers) {
        node.endHandler.push(
          new Function('return ' + handler)() as (arg: any) => any
        );
      }
    }
    for (let i = 0; i < data.length; i++) {
      let node = nodes[i];
      let data_edges = data[i].edges;
      for (let d_edge of data_edges) {
        node.addEdge(
          new AutomatonEdge(d_edge.start, d_edge.end, [nodes[d_edge.target]])
        );
      }
    }
    return new DFAAutomaton(nodes[0]);
  }
  public serialize(): DFAAutonSerializedData {
    let start = this.start;
    let cache: {
      [key in number]: number;
    } = {
      [start.idx]: 0,
    };
    let fifo = [start] as AutomatonNode[];
    let output: {
      edges: {
        start: number;
        end: number;
        target: number;
      }[];
      handlers: string[];
    }[] = [
      {
        edges: [],
        handlers: start.endHandler.map((item) => item.toString()),
      },
    ];
    for (; fifo.length > 0; ) {
      let nowState = fifo.shift();
      assert(nowState != undefined);
      let outputNowStateIdx = cache[nowState.idx];
      for (let edge of nowState.edges.toArray()) {
        assert(edge.target.length == 1, 'DFA的targe是唯一的');
        let target = edge.target[0];

        if (cache[target.idx] == undefined) {
          cache[target.idx] = output.length;
          output.push({
            edges: [],
            handlers: target.endHandler.map((item) => item.toString()),
          });
          fifo.push(target);
        }
        output[outputNowStateIdx].edges.push({
          start: edge.start,
          end: edge.end,
          target: cache[target.idx],
        });
      }
    }
    return output;
  }
}
export interface LexerRule<T> {
  reg: string;
  handler: (text: string) => T;
}
