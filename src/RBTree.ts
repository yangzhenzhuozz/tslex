import { assert } from './tools.js';

class RBTreeNode<T> {
  public color: 'red' | 'black' = 'red';
  public value: T;
  public parent?: RBTreeNode<T>;
  private _leftChild?: RBTreeNode<T>;
  private _rightChild?: RBTreeNode<T>;

  get leftChild(): RBTreeNode<T> | undefined {
    return this._leftChild;
  }
  set leftChild(node: RBTreeNode<T> | undefined) {
    this._leftChild = node;
    if (node != undefined) {
      node.parent = this;
    }
  }

  get rightChild(): RBTreeNode<T> | undefined {
    return this._rightChild;
  }
  set rightChild(node: RBTreeNode<T> | undefined) {
    this._rightChild = node;
    if (node != undefined) {
      node.parent = this;
    }
  }

  get isLeftChild() {
    return this == this.parent?.leftChild;
  }

  get isRoot() {
    return this.parent == undefined;
  }

  get grandfather() {
    assert(this.parent?.parent != undefined);
    return this.parent.parent;
  }

  get brother() {
    assert(this.parent != undefined);
    if (this.isLeftChild) {
      return this.parent.rightChild;
    } else {
      return this.parent.leftChild;
    }
  }

  get uncle() {
    assert(this.parent != undefined);
    if (this.parent.isLeftChild) {
      return this.grandfather.rightChild;
    } else {
      return this.grandfather.leftChild;
    }
  }
  public constructor(value: T) {
    this.value = value;
  }

  public toString() {
    return `${this.color},${this.value}`;
  }
}

export class RBTree<T> {
  private _root?: RBTreeNode<T>;
  private get root(): RBTreeNode<T> | undefined {
    return this._root;
  }
  private set root(node: RBTreeNode<T> | undefined) {
    this._root = node;
    if (node != undefined) node.parent = undefined;
  }
  private comparer: (a: T, b: T) => number;
  public constructor(comparer: (a: T, b: T) => number) {
    this.comparer = comparer;
  }
  private leftRotate(node: RBTreeNode<T>) {
    let rightChild = node.rightChild;
    assert(rightChild != undefined, `cann't left rorate`);
    let R_L_child = rightChild.leftChild;

    if (node.isRoot) this.root = rightChild;
    else if (node.isLeftChild) node.parent!.leftChild = rightChild;
    else node.parent!.rightChild = rightChild;

    node.rightChild = R_L_child;
    rightChild.leftChild = node;
  }
  private rightRotate(node: RBTreeNode<T>) {
    let leftChild = node.leftChild;
    assert(leftChild != undefined, `cann't right rorate`);
    let L_R_child = leftChild.rightChild;

    if (node.isRoot) this.root = leftChild;
    else if (node.isLeftChild) node.parent!.leftChild = leftChild;
    else node.parent!.rightChild = leftChild;

    node.leftChild = L_R_child;
    leftChild.rightChild = node;
  }

  /**
   * return the matched node when tree contain the value
   * otherwise which is end point in search path
   * @param value value
   */
  private _find(value: T): RBTreeNode<T> {
    assert(this.root != undefined, 'canot serch in a empty tree');
    let node = this.root;
    for (;;) {
      let ret = this.comparer(node.value, value);
      if (ret == 0) {
        break;
      } else if (ret > 0) {
        if (node.leftChild == undefined) {
          break;
        } else {
          node = node.leftChild;
        }
      } else {
        if (node.rightChild == undefined) {
          break;
        } else {
          node = node.rightChild;
        }
      }
    }
    return node;
  }
  private blanceInsert(node: RBTreeNode<T>) {
    assert(node.parent != undefined);
    if (node.parent.color == 'black') return;
    //beacuse parent is red,so grandparent must be black
    if (node.uncle == undefined) {
      //rotate and change color to LL or RR
      let branch: 'LL' | 'RR';
      if (node.parent.isLeftChild) {
        if (!node.isLeftChild) {
          this.leftRotate(node.parent);
          node = node.leftChild!;
        }
        branch = 'LL';
      } else {
        if (node.isLeftChild) {
          this.rightRotate(node.parent);
          node = node.rightChild!;
        }
        branch = 'RR';
      }

      if (branch == 'LL') {
        this.rightRotate(node.grandfather);
      } else {
        this.leftRotate(node.grandfather);
      }
      assert(node.parent != undefined);
      node.parent.color = 'black';
      assert(node.brother != undefined);
      node.brother.color = 'red';
    } else {
      node.parent.color = 'black';
      node.uncle.color = 'black';
      if (!node.grandfather.isRoot) {
        node.grandfather.color = 'red';
        this.blanceInsert(node.grandfather);
      }
    }
  }
  public add(value: T) {
    // tree is empty
    if (this.root == undefined) {
      this.root = new RBTreeNode(value);
      this.root.color = 'black';
      return;
    }
    let parent = this._find(value);
    let ret = this.comparer(parent.value, value);

    // swap value
    if (ret == 0) {
      parent.value = value;
      return;
    }

    let node = new RBTreeNode(value);
    if (ret > 0) {
      parent.leftChild = node;
    } else {
      parent.rightChild = node;
    }
    if (parent.color == 'red') {
      //parent is a leaf in this case
      this.blanceInsert(node);
    }
  }

  private blanceRemove(node: RBTreeNode<T>) {
    if (node.isRoot) return;
    let brother = node.brother;
    let parent = node.parent;
    assert(brother != undefined);
    assert(parent != undefined);
    if (brother.color == 'black') {
      if (brother.leftChild?.color == 'red') {
        let brotherLeft = brother.leftChild;
        if (brother.isLeftChild) {
          this.rightRotate(parent);
        } else {
          this.rightRotate(brother);
          this.leftRotate(parent);
        }
        brotherLeft.color = 'black';
      } else if (brother.rightChild?.color == 'red') {
        let brotherRight = brother.rightChild;
        if (brother.isLeftChild) {
          this.leftRotate(brother);
          this.rightRotate(parent);
          brotherRight.color = 'black';
        } else {
          this.leftRotate(parent);
          brotherRight.color = 'black';
        }
      } else {
        //cann't blacne by rotate
        brother.color = 'red';
        this.blanceRemove(parent);
      }
    } else {
      if (brother.isLeftChild) {
        let brotherRight = brother.rightChild;
        this.rightRotate(parent);
        brother.color = 'black';
        brotherRight!.color = 'red';
      } else {
        let brotherLeft = brother.leftChild;
        this.leftRotate(parent);
        brother.color = 'black';
        brotherLeft!.color = 'red';
      }
    }
  }
  public remove(value: T) {
    let node = this._find(value);
    if (this.comparer(node.value, value) != 0) {
      return;
    }

    //find the next node
    if (node.rightChild != undefined) {
      let next = node.rightChild;
      while (next.leftChild != undefined) {
        next = next.leftChild;
      }
      node.value = next.value;
      node = next;
    }

    let child = node.leftChild != undefined ? node.leftChild : node.rightChild;
    //there is only one child and it is red
    if (child == undefined) {
      if (node.color == 'red') {
        //do nothing
      } else {
        //node is black
        this.blanceRemove(node);
      }

      //node is a leaf and remove it
      if (node.isRoot) {
        this.root = undefined;
      } else {
        if (node.isLeftChild) {
          node.parent!.leftChild = undefined;
        } else {
          node.parent!.rightChild = undefined;
        }
      }
    } else {
      child.color = 'black';
      if (node.isRoot) {
        this.root = child;
      } else {
        if (node.isLeftChild) {
          node.parent!.leftChild = child;
        } else {
          node.parent!.rightChild = child;
        }
      }
    }
  }

  public find(value: T): T | undefined {
    if (this.root == undefined) {
      return undefined;
    }
    let node = this._find(value);
    if (this.comparer(node.value, value) == 0) {
      return node.value;
    } else {
      return undefined;
    }
  }

  public has(value: T): boolean {
    return this.find(value) != undefined;
  }
  public get values(): T[] {
    return this.toArray();
  }
  public toArray(): T[] {
    let cache: T[] = [];
    function inOrderTraversal(node: RBTreeNode<T> | undefined) {
      if (node == undefined) return;
      inOrderTraversal(node.leftChild);
      cache.push(node.value);
      inOrderTraversal(node.rightChild);
    }
    inOrderTraversal(this.root);
    return cache;
  }

  /**
   * 测试函数
   */
  static test() {
    let tree: RBTree<number>;
    tree = new RBTree<number>((a, b) => a - b);

    // tree.root = new RBTreeNode(5);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(2);
    // tree.root.leftChild.color = 'black';
    // tree.root.rightChild = new RBTreeNode(6);
    // tree.root.rightChild.color = 'black';
    // tree.root.leftChild.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.leftChild.color = 'red';
    // tree.root.leftChild.rightChild = new RBTreeNode(3);
    // tree.root.leftChild.rightChild.color = 'red';
    // debugger;
    // tree.remove(1);

    // tree.root = new RBTreeNode(6);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(4);
    // tree.root.leftChild.color = 'black';
    // tree.root.leftChild.leftChild = new RBTreeNode(2);
    // tree.root.leftChild.leftChild.color = 'black';
    // tree.root.leftChild.rightChild = new RBTreeNode(5);
    // tree.root.leftChild.rightChild.color = 'black';
    // tree.root.leftChild.leftChild.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.leftChild.leftChild.color = 'red';
    // tree.root.rightChild = new RBTreeNode(8);
    // tree.root.rightChild.color = 'black';
    // tree.root.rightChild.leftChild = new RBTreeNode(7);
    // tree.root.rightChild.leftChild.color = 'black';
    // tree.root.rightChild.rightChild = new RBTreeNode(9);
    // tree.root.rightChild.rightChild.color = 'black';
    // debugger;
    // tree.remove(2);

    // tree.root = new RBTreeNode(6);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(4);
    // tree.root.leftChild.color = 'black';
    // tree.root.leftChild.leftChild = new RBTreeNode(2);
    // tree.root.leftChild.leftChild.color = 'black';
    // tree.root.leftChild.rightChild = new RBTreeNode(5);
    // tree.root.leftChild.rightChild.color = 'black';
    // tree.root.leftChild.rightChild.leftChild = new RBTreeNode(4.5);
    // tree.root.leftChild.rightChild.leftChild.color = 'red';
    // tree.root.rightChild = new RBTreeNode(8);
    // tree.root.rightChild.color = 'black';
    // tree.root.rightChild.leftChild = new RBTreeNode(7);
    // tree.root.rightChild.leftChild.color = 'black';
    // tree.root.rightChild.rightChild = new RBTreeNode(9);
    // tree.root.rightChild.rightChild.color = 'black';
    // debugger;
    // tree.remove(2);

    // tree.root = new RBTreeNode(3);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(2);
    // tree.root.leftChild.color = 'black';
    // tree.root.leftChild.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.leftChild.color = 'red';
    // tree.root.rightChild = new RBTreeNode(4);
    // tree.root.rightChild.color = 'black';
    // debugger;
    // tree.remove(4);

    // tree.root = new RBTreeNode(3);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.color = 'black';
    // tree.root.leftChild.rightChild = new RBTreeNode(2);
    // tree.root.leftChild.rightChild.color = 'red';
    // tree.root.rightChild = new RBTreeNode(4);
    // tree.root.rightChild.color = 'black';
    // debugger;
    // tree.remove(4);

    // tree.root = new RBTreeNode(2);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.color = 'black';
    // tree.root.rightChild = new RBTreeNode(3);
    // tree.root.rightChild.color = 'black';
    // tree.root.rightChild.rightChild = new RBTreeNode(4);
    // tree.root.rightChild.rightChild.color = 'red';
    // debugger;
    // tree.remove(1);

    // tree.root = new RBTreeNode(2);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.color = 'black';
    // tree.root.rightChild = new RBTreeNode(3);
    // tree.root.rightChild.color = 'black';
    // tree.remove(1);
    // debugger

    // tree.root = new RBTreeNode(4);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(2);
    // tree.root.leftChild.color = 'black';
    // tree.root.leftChild.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.leftChild.color = 'black';
    // tree.root.leftChild.rightChild = new RBTreeNode(3);
    // tree.root.leftChild.rightChild.color = 'black';
    // tree.root.rightChild = new RBTreeNode(6);
    // tree.root.rightChild.color = 'black';
    // tree.root.rightChild.leftChild = new RBTreeNode(5);
    // tree.root.rightChild.leftChild.color = 'black';
    // tree.root.rightChild.rightChild = new RBTreeNode(7);
    // tree.root.rightChild.rightChild.color = 'black';
    // tree.remove(1);
    // debugger

    // tree.root = new RBTreeNode(4);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(2);
    // tree.root.leftChild.color = 'red';
    // tree.root.leftChild.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.leftChild.color = 'black';
    // tree.root.leftChild.rightChild = new RBTreeNode(3);
    // tree.root.leftChild.rightChild.color = 'black';
    // tree.root.rightChild = new RBTreeNode(5);
    // tree.root.rightChild.color = 'black';
    // tree.remove(5);
    // debugger;

    // tree.root = new RBTreeNode(2);
    // tree.root.color = 'black';
    // tree.root.leftChild = new RBTreeNode(1);
    // tree.root.leftChild.color = 'black';
    // tree.root.rightChild = new RBTreeNode(4);
    // tree.root.rightChild.color = 'red';
    // tree.root.rightChild.leftChild = new RBTreeNode(3);
    // tree.root.rightChild.leftChild.color = 'black';
    // tree.root.rightChild.rightChild = new RBTreeNode(5);
    // tree.root.rightChild.rightChild.color = 'black';
    // tree.remove(1);
    // debugger;
  }
}
