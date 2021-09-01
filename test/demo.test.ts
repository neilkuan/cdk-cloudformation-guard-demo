import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { guardDemo, guardDemoFail } from '../src/main';

test('Testing', () => {
  const app = new App();
  const stack = new guardDemo(app, 'test1', { isDefaultvpc: false });
  const stack2 = new guardDemoFail(app, 'test2', { isDefaultvpc: false });
  expect(stack).not.toHaveResource('AWS::S3::Bucket');
  expect(stack2).not.toHaveResource('AWS::S3::Bucket');
  expect(stack).toHaveResource('AWS::EC2::SecurityGroup');
  expect(stack).toHaveResource('AWS::EC2::SecurityGroup');
  expect(stack2).toHaveResource('AWS::EC2::SecurityGroup');
  expect(stack2).toHaveResource('AWS::EC2::SecurityGroup');
});