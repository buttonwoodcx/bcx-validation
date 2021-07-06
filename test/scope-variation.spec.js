import test from 'tape';
import _ from 'lodash';
import scopeVariation from '../src/scope-variation';
import proxy from 'contextual-proxy';
import ScopedEval from 'scoped-eval';

const scopedEval = new ScopedEval();

test('scopeVariation: creates scope variation', t => {
  const model = {a: 1, b: 2};
  const parent = {c: 3, d: 4};

  const scope = proxy(model, parent);

  const variation = scopeVariation(scope, {a: 'one', c: {new: 1}});

  t.deepEqual(model, {a: 1, b: 2}, 'does not touch original object');
  t.deepEqual(parent, {c: 3, d: 4}, 'does not touch original parent object');

  t.equal(scopedEval.eval('a', scope), 1);
  t.equal(scopedEval.eval('a', variation), 'one');

  t.equal(scopedEval.eval('b', scope), 2);
  t.equal(scopedEval.eval('b', variation), 2);

  t.equal(scopedEval.eval('c', scope), 3);
  t.deepEqual(scopedEval.eval('c', variation), {new: 1});

  t.equal(scopedEval.eval('$parent.a', scope), undefined);
  t.equal(scopedEval.eval('$parent.a', variation), undefined);

  t.equal(scopedEval.eval('$parent.b', scope), undefined);
  t.equal(scopedEval.eval('$parent.b', variation), undefined);

  t.equal(scopedEval.eval('$parent.c', scope), 3);
  t.deepEqual(scopedEval.eval('$parent.c', variation), 3);

  t.end();
});
