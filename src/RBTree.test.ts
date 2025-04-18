import { checkRBTreeProperties, RBTree } from './RBTree.js';

describe('红黑树测试', () => {
  let tree: RBTree<number>;

  beforeEach(() => {
    tree = new RBTree<number>((a, b) => a - b);
  });

  test('应该正确插入值', () => {
    tree.add(10);
    tree.add(20);
    tree.add(5);

    expect(tree.values).toEqual([5, 10, 20]);
  });

  test('应该正确删除值', () => {
    tree.add(10);
    tree.add(20);
    tree.add(5);

    tree.remove(10);
    expect(tree.values).toEqual([5, 20]);

    tree.remove(5);
    expect(tree.values).toEqual([20]);
  });

  test('应该保持红黑树的性质', () => {
    tree.add(10);
    tree.add(20);
    tree.add(5);
    tree.add(15);
    tree.add(25);

    expect(checkRBTreeProperties(tree)).toBe(true);
  });
});
