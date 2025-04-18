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
    return `(${this.value},${this.color})`;
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
  private insertFix(node: RBTreeNode<T>) {
    // 如果当前节点的父节点是黑色，则无需修复
    while (node.parent && node.parent.color === 'red') {
      // 父节点是祖父节点的左子节点
      if (node.parent.isLeftChild) {
        const uncle = node.uncle;

        // 情况 1：叔叔节点是红色
        if (uncle && uncle.color === 'red') {
          node.parent.color = 'black'; // 父节点变黑
          uncle.color = 'black'; // 叔叔节点变黑
          node.grandfather!.color = 'red'; // 祖父节点变红
          node = node.grandfather!; // 将当前节点上移到祖父节点
        } else {
          // 情况 2：叔叔节点是黑色，当前节点是右子节点
          if (node === node.parent.rightChild) {
            node = node.parent;
            this.leftRotate(node); // 左旋父节点
          }

          // 情况 3：叔叔节点是黑色，当前节点是左子节点
          node.parent!.color = 'black'; // 父节点变黑
          node.grandfather!.color = 'red'; // 祖父节点变红
          this.rightRotate(node.grandfather!); // 右旋祖父节点
        }
      } else {
        // 父节点是祖父节点的右子节点
        const uncle = node.uncle;

        // 情况 1：叔叔节点是红色
        if (uncle && uncle.color === 'red') {
          node.parent.color = 'black'; // 父节点变黑
          uncle.color = 'black'; // 叔叔节点变黑
          node.grandfather!.color = 'red'; // 祖父节点变红
          node = node.grandfather!; // 将当前节点上移到祖父节点
        } else {
          // 情况 2：叔叔节点是黑色，当前节点是左子节点
          if (node === node.parent.leftChild) {
            node = node.parent;
            this.rightRotate(node); // 右旋父节点
          }

          // 情况 3：叔叔节点是黑色，当前节点是右子节点
          node.parent!.color = 'black'; // 父节点变黑
          node.grandfather!.color = 'red'; // 祖父节点变红
          this.leftRotate(node.grandfather!); // 左旋祖父节点
        }
      }
    }

    // 确保根节点始终是黑色
    this.root!.color = 'black';
  }
  public add(value: T) {
    // 如果树为空，直接插入根节点并将其颜色设置为黑色
    if (this.root == undefined) {
      this.root = new RBTreeNode(value);
      this.root.color = 'black';
      return;
    }

    // 找到插入位置
    let parent = this._find(value);
    let comparison = this.comparer(parent.value, value);

    // 如果值已存在，直接更新节点值
    if (comparison === 0) {
      parent.value = value;
      return;
    }

    // 创建新节点并插入到父节点的左或右子树
    let newNode = new RBTreeNode(value);
    if (comparison > 0) {
      parent.leftChild = newNode;
    } else {
      parent.rightChild = newNode;
    }

    // 修复红黑树性质
    this.insertFix(newNode);
    // checkRBTreeProperties(this);//每插入一个节点就校验一次红黑树性质
  }

  private removeFix(node: RBTreeNode<T>) {
    while (!node.isRoot && node.color === 'black') {
      if (node.isLeftChild) {
        let brother = node.brother!;
        // 情况 1：兄弟节点是红色
        if (brother.color === 'red') {
          brother.color = 'black';
          node.parent!.color = 'red';
          this.leftRotate(node.parent!);
          brother = node.brother!;
        }

        // 情况 2：兄弟节点是黑色，且兄弟的两个子节点都是黑色
        if (
          (!brother.leftChild || brother.leftChild.color === 'black') &&
          (!brother.rightChild || brother.rightChild.color === 'black')
        ) {
          brother.color = 'red';
          node = node.parent!;
        } else {
          // 情况 3：兄弟节点是黑色，兄弟的左子节点是红色，右子节点是黑色
          if (!brother.rightChild || brother.rightChild.color === 'black') {
            if (brother.leftChild) brother.leftChild.color = 'black';
            brother.color = 'red';
            this.rightRotate(brother);
            brother = node.brother!;
          }

          // 情况 4：兄弟节点是黑色，兄弟的右子节点是红色
          brother.color = node.parent!.color;
          node.parent!.color = 'black';
          if (brother.rightChild) brother.rightChild.color = 'black';
          this.leftRotate(node.parent!);
          node = this.root!;
        }
      } else {
        let brother = node.brother!;
        // 情况 1：兄弟节点是红色
        if (brother.color === 'red') {
          brother.color = 'black';
          node.parent!.color = 'red';
          this.rightRotate(node.parent!);
          brother = node.brother!;
        }

        // 情况 2：兄弟节点是黑色，且兄弟的两个子节点都是黑色
        if (
          (!brother.leftChild || brother.leftChild.color === 'black') &&
          (!brother.rightChild || brother.rightChild.color === 'black')
        ) {
          brother.color = 'red';
          node = node.parent!;
        } else {
          // 情况 3：兄弟节点是黑色，兄弟的右子节点是红色，左子节点是黑色
          if (!brother.leftChild || brother.leftChild.color === 'black') {
            if (brother.rightChild) brother.rightChild.color = 'black';
            brother.color = 'red';
            this.leftRotate(brother);
            brother = node.brother!;
          }

          // 情况 4：兄弟节点是黑色，兄弟的左子节点是红色
          brother.color = node.parent!.color;
          node.parent!.color = 'black';
          if (brother.leftChild) brother.leftChild.color = 'black';
          this.rightRotate(node.parent!);
          node = this.root!;
        }
      }
    }

    node.color = 'black';
  }

  public remove(value: T) {
    // 找到要删除的节点
    let node = this._find(value);
    if (this.comparer(node.value, value) !== 0) {
      return; // 如果值不存在，直接返回
    }

    // 如果节点有右子节点，找到后继节点替换当前节点
    if (node.rightChild !== undefined) {
      let successor = node.rightChild;
      while (successor.leftChild !== undefined) {
        successor = successor.leftChild;
      }
      node.value = successor.value; // 用后继节点的值替换当前节点
      node = successor; // 删除后继节点
    }

    // 获取唯一的子节点（如果存在）
    let child = node.leftChild !== undefined ? node.leftChild : node.rightChild;

    // 如果节点是黑色，需要修复红黑树性质
    if (node.color === 'black') {
      if (child !== undefined) {
        child.color = 'black'; // 子节点变黑
      } else {
        this.removeFix(node); // 修复红黑树性质
      }
    }

    // 删除节点
    if (node.isRoot) {
      this.root = child; // 如果是根节点，直接替换为子节点
    } else {
      if (node.isLeftChild) {
        node.parent!.leftChild = child;
      } else {
        node.parent!.rightChild = child;
      }
      if (child !== undefined) {
        child.parent = node.parent; // 更新子节点的父节点
      }
    }
    // checkRBTreeProperties(this);//每删除一个节点就校验一次红黑树性质
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
  public inOrderTraversal(
    node: RBTreeNode<T> | undefined,
    result: T[] = []
  ): T[] {
    if (node === undefined) return result;
    // 递归遍历左子树
    this.inOrderTraversal(node.leftChild, result);
    // 访问当前节点
    result.push(node.value);
    // 递归遍历右子树
    this.inOrderTraversal(node.rightChild, result);
    return result;
  }
  public toArray(): T[] {
    return this.inOrderTraversal(this.root);
  }
}

export function checkRBTreeProperties<T>(tree: RBTree<T>): boolean {
  console.log('开始检查红黑树性质');
  const root = (tree as any)._root as RBTreeNode<T> | undefined;

  if (!root) return true; // 空树满足红黑树性质

  // 性质 1：根节点是黑色
  if (root.color !== 'black') {
    console.error('根节点不是黑色');
    return false;
  }

  // 性质 2：红色节点的子节点必须是黑色
  function checkRedNodeChildren(node: RBTreeNode<T> | undefined): boolean {
    if (!node) return true;
    if (node.color === 'red') {
      if (node.leftChild?.color === 'red' || node.rightChild?.color === 'red') {
        console.error('红色节点的子节点中存在红色节点:', node.value);
        return false;
      }
    }
    return (
      checkRedNodeChildren(node.leftChild) &&
      checkRedNodeChildren(node.rightChild)
    );
  }

  // 性质 3：每个节点到叶子节点的所有路径包含相同数量的黑色节点
  function checkBlackHeight(node: RBTreeNode<T> | undefined): {
    valid: boolean;
    blackHeight: number;
  } {
    if (!node) return { valid: true, blackHeight: 1 };

    const left = checkBlackHeight(node.leftChild);
    const right = checkBlackHeight(node.rightChild);

    if (!left.valid || !right.valid || left.blackHeight !== right.blackHeight) {
      console.error('节点的黑色高度不一致:', node.value);
      return { valid: false, blackHeight: 0 };
    }

    const blackHeight = left.blackHeight + (node.color === 'black' ? 1 : 0);
    return { valid: true, blackHeight };
  }

  return checkRedNodeChildren(root) && checkBlackHeight(root).valid;
}
