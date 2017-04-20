import test from 'tape';
import valueEvaluator from '../src/value-evaluator';
import {createScope} from 'bcx-expression-evaluator';

const $value = "abc";
const $propertyPath = "property";
const $neighbours = [new Object(), new Object()];

const $model = {
  property: $value,
  some: 'other',
};

const $parentModel = new Object();

const scope = createScope({
  ... $model,
  $value,
  $propertyPath,
  $neighbours
}, $parentModel);


test('valueEvaluator: builds for string', t => {
  t.throws(() => valueEvaluator(''), 'rejects empty expression');

  let e = valueEvaluator('$value + some');
  t.equal(e(scope), 'abcother');

  e = valueEvaluator('${$value}some', {stringInterpolationMode: true});
  t.equal(e(scope), 'abcsome');
  t.end();
});

test('valueEvaluator: builds for regex', t => {
  let e = valueEvaluator(/ab/);
  t.equal(e(scope), true);

  e = valueEvaluator(/ab$/);
  t.equal(e(scope), false);
  t.end();
});

test('valueEvaluator: builds for function', t => {
  function test(value, propertyPath, context, neighbours, parentContext) {
    t.equal(value, $value);
    t.equal(propertyPath, $propertyPath);
    t.deepEqual(context, {
      property: $value,
      some: 'other',
      $value,
      $propertyPath,
      $neighbours
    });

    t.equal(neighbours, $neighbours);
    t.equal(parentContext, $parentModel);
    t.end();
  }

  let e = valueEvaluator(test);
  e(scope);
});

test('valueEvaluator: rejects unknown input', t => {
  t.throws(() => valueEvaluator(), 'rejects undefined input');
  t.throws(() => valueEvaluator(null), 'rejects null input');
  t.throws(() => valueEvaluator([]), 'rejects unknown input');
  t.throws(() => valueEvaluator({}), 'rejects unknown input');
  t.end();
});
