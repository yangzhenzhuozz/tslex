import { RBTree } from './RBTree.js';

class Edge {
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
  public separate(other: Edge): Edge[] {
    let ret: Edge[];
    let cmp = Edge.compare(this, other);
    if (cmp < 0 || cmp > 0) {
      ret = [
        new Edge(this.start, this.end, this.target),
        new Edge(other.start, other.end, other.target),
      ];
    } else {
      if (other.start < this.start && other.end > this.end) {
        ret = [
          new Edge(other.start, this.start - 1, other.target),
          new Edge(this.start, this.end, [...this.target, ...other.target]),
          new Edge(this.end + 1, other.end, other.target),
        ];
      } else if (this.start === other.start && this.end === other.end) {
        ret = [
          new Edge(this.start, this.end, [...this.target, ...other.target]),
        ];
      } else if (this.start === other.start && this.end > other.end) {
        ret = [
          new Edge(this.start, other.end, [...this.target, ...other.target]),
          new Edge(other.end + 1, this.end, this.target),
        ];
      } else if (this.end === other.end && this.start < other.start) {
        ret = [
          new Edge(this.start, other.start - 1, this.target),
          new Edge(other.start, this.end, [...this.target, ...other.target]),
        ];
      } else if (other.start > this.start && other.end < this.end) {
        ret = [
          new Edge(this.start, other.start - 1, this.target),
          new Edge(other.start, other.end, [...this.target, ...other.target]),
          new Edge(other.end + 1, this.end, this.target),
        ];
      } else if (other.start < this.start) {
        ret = [
          new Edge(other.start, this.start - 1, other.target),
          new Edge(this.start, other.end, [...this.target, ...other.target]),
          new Edge(other.end + 1, this.end, this.target),
        ];
      } else if (other.end > this.end) {
        ret = [
          new Edge(this.start, other.start - 1, this.target),
          new Edge(other.start, this.end, [...this.target, ...other.target]),
          new Edge(this.end + 1, other.end, other.target),
        ];
      } else {
        throw '不可能出现的情况';
      }
    }
    return ret;
  }
  public static compare(a: Edge, b: Edge): number {
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
  public edges: RBTree<Edge>;
  public constructor() {
    this.idx = AutomatonNode.counter;
    AutomatonNode.counter++;
    this.edges = new RBTree(Edge.compare);
  }
  public addEdge(edge: Edge) {
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
    let a = new Edge(10, 20, []);
    let b = new Edge(11, 20, []);
    node.addEdge(a);
    node.addEdge(b);
  }
}
export class Automaton {
  public constructor() {}
}
