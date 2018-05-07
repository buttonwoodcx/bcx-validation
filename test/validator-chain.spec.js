import test from 'tape';
import _ from 'lodash';
import validatorChain from '../src/validator-chain';

const validators = [
  scope => ({t:0, break: scope.breakAt0}),
  scope => ({t:1, break: scope.breakAt1}),
  scope => ({t:2, break: scope.breakAt2}),
];

const chain = validatorChain(validators);

test('validatorChain: chains results', t => {
  const result = chain({});
  t.equal(result.length, 3);
  t.deepEqual(_.map(result, 't'), [0, 1, 2]);
  t.end();
});

test('validatorChain: supports early break', t => {
  let result = chain({breakAt0: true});
  t.equal(result.length, 1);
  t.deepEqual(_.map(result, 't'), [0]);
  t.notOk(result.break);

  result = chain({breakAt1: true});
  t.equal(result.length, 2);
  t.deepEqual(_.map(result, 't'), [0, 1]);
  t.notOk(result.break);
  t.end();
});

test('validatorChain: surfaces out final break', t => {
  let result = chain({breakAt2: true});
  t.equal(result.length, 3);
  t.deepEqual(_.map(result, 't'), [0, 1, 2]);
  t.ok(result.break);
  t.end();
});
