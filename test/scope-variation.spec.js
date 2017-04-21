import test from 'tape';
import _ from 'lodash';
import scopeVariation from '../src/scope-variation';
import {createSimpleScope, Parser} from 'bcx-expression-evaluator';

const parser = new Parser();

test('scopeVariation: creates scope variation', t => {
  const model = {a: 1, b: 2};
  const parent = {c: 3, d: 4};

  const scope = createSimpleScope(model, parent);

  const variation = scopeVariation(scope, {a: 'one', c: {new: 1}});

  t.deepEqual(model, {a: 1, b: 2}, 'does not touch original bindingContext');
  t.deepEqual(parent, {c: 3, d: 4}, 'does not touch original parentBindingContext');

  t.equal(parser.parse('a').evaluate(scope), 1);
  t.equal(parser.parse('a').evaluate(variation), 'one');

  t.equal(parser.parse('b').evaluate(scope), 2);
  t.equal(parser.parse('b').evaluate(variation), 2);

  t.equal(parser.parse('c').evaluate(scope), 3);
  t.deepEqual(parser.parse('c').evaluate(variation), {new: 1});

  t.equal(parser.parse('$parent.a').evaluate(scope), undefined);
  t.equal(parser.parse('$parent.a').evaluate(variation), undefined);

  t.equal(parser.parse('$parent.b').evaluate(scope), undefined);
  t.equal(parser.parse('$parent.b').evaluate(variation), undefined);

  t.equal(parser.parse('$parent.c').evaluate(scope), 3);
  t.deepEqual(parser.parse('$parent.c').evaluate(variation), 3);

  t.end();
});
