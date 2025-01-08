import { RBTree } from './RBTree.js';

export class AutomatonEdge {
  public start: number;
  public end: number;
  public target: AutomatonNode[];
  public constructor(start: number, end: number, target: AutomatonNode[]) {
    if (end < start) {
      throw 'end必须不小于start';
    }
    this.start = start;
    this.end = end;
    this.target = target;
  }
  public separate(other: AutomatonEdge): AutomatonEdge[] {
    let ret: AutomatonEdge[];
    let cmp = AutomatonEdge.compare(this, other);
    if (cmp < 0 || cmp > 0) {
      ret = [
        new AutomatonEdge(this.start, this.end, this.target),
        new AutomatonEdge(other.start, other.end, other.target),
      ];
    } else {
      if (other.start < this.start && other.end > this.end) {
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
      } else if (this.start === other.start && this.end > other.end) {
        ret = [
          new AutomatonEdge(this.start, other.end, [
            ...this.target,
            ...other.target,
          ]),
          new AutomatonEdge(other.end + 1, this.end, this.target),
        ];
      } else if (this.end === other.end && this.start < other.start) {
        ret = [
          new AutomatonEdge(this.start, other.start - 1, this.target),
          new AutomatonEdge(other.start, this.end, [
            ...this.target,
            ...other.target,
          ]),
        ];
      } else if (other.start > this.start && other.end < this.end) {
        ret = [
          new AutomatonEdge(this.start, other.start - 1, this.target),
          new AutomatonEdge(other.start, other.end, [
            ...this.target,
            ...other.target,
          ]),
          new AutomatonEdge(other.end + 1, this.end, this.target),
        ];
      } else if (other.start < this.start) {
        ret = [
          new AutomatonEdge(other.start, this.start - 1, other.target),
          new AutomatonEdge(this.start, other.end, [
            ...this.target,
            ...other.target,
          ]),
          new AutomatonEdge(other.end + 1, this.end, this.target),
        ];
      } else if (other.end > this.end) {
        ret = [
          new AutomatonEdge(this.start, other.start - 1, this.target),
          new AutomatonEdge(other.start, this.end, [
            ...this.target,
            ...other.target,
          ]),
          new AutomatonEdge(this.end + 1, other.end, other.target),
        ];
      } else {
        throw '不可能出现的情况';
      }
    }
    return ret;
  }
  public not(): AutomatonEdge[] {
    if (this.start == 0 && this.end == 0xffff) {
      //-1永远不会被匹配
      return [new AutomatonEdge(-1, -1, this.target)];
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
    return `(${this.start}, ${this.end})`;
  }
}

class AutomatonNode {
  static counter = 0;
  public idx: number;
  public edges: RBTree<AutomatonEdge>;
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
      this.edges.insert(edge);
    }
  }
  public static test() {
    //通过修改a,b的区间来测试，覆盖Edge的所有separate情况
    let node = new AutomatonNode();
    let a = new AutomatonEdge(10, 20, []);
    let b = new AutomatonEdge(11, 20, []);
    node.addEdge(a);
    node.addEdge(b);
  }
}
export class Automaton {
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
   * @returns {Automaton} 新的自动机实例
   */
  public clone(): Automaton {
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
    return new Automaton({
      nodes: [newStart, newEnd],
    });
  }
  public kleeneClosure() {
    let newStart = new AutomatonNode();
    let newEnd = new AutomatonNode();
    newStart.addEdge(new AutomatonEdge(0, 0, [this.start, newEnd]));
    this.end.addEdge(new AutomatonEdge(0, 0, [this.start, newEnd]));
    this.start = newStart;
    this.end = newEnd;
  }
  public concatenate(automaton: Automaton) {
    this.end.addEdge(new AutomatonEdge(0, 0, [automaton.start]));
    this.end = automaton.end;
  }
  public union(automaton: Automaton) {
    let newStart = new AutomatonNode();
    newStart.addEdge(new AutomatonEdge(0, 0, [this.start, automaton.start]));
    let newEnd = new AutomatonNode();
    this.end.addEdge(new AutomatonEdge(0, 0, [newEnd]));
    automaton.end.addEdge(new AutomatonEdge(0, 0, [newEnd]));
    this.start = newStart;
    this.end = newEnd;
  }
  
  //测试代码
  public static test() {
    let a = new Automaton({ ch: [99, 99] });
    a.kleeneClosure();
    let n = a.clone();
    debugger;
  }
}
