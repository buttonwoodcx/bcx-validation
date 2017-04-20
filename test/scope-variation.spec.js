import test from 'tape';
import _ from 'lodash';
import scopeVariation from '../src/scope-variation';
import {createScope} from 'bcx-expression-evaluator';

test('scopeVariation: creates scope variation', t => {
  const model = {a: 1, b: 2};
  const parent = {c: 3, d: 4};

  const scope = createScope(model, parent);

  const variation = scopeVariation(scope, {a: 'one', c: {new: 1}});

  t.deepEqual(model, {a: 1, b: 2}, 'does not touch original bindingContext');
  t.deepEqual(parent, {c: 3, d: 4}, 'does not touch original parentBindingContext');

  t.deepEqual(variation[0], {a: 'one', b: 2, c: {new: 1}}, 'creates new bindingContext');
  t.deepEqual(variation[1], {c: 3, d: 4}, 'keep same parent context');
  t.equal(scope[1], parent, 'keep parent bindingContext');

  t.end();
});
