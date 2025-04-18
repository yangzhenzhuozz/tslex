export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // 解决 TypeScript 中的 .js 导入问题
  },
  roots: ['<rootDir>/src'], // 测试文件所在目录
};
