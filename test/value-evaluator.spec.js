import test from 'tape';
import {valueEvaluator} from '../src/value-evaluator';
import {createSimpleScope} from 'bcx-expression-evaluator';

const $value = "abc";
const $propertyName = "property";
const $neighbours = [new Object(), new Object()];

const $model = {
  property: $value,
  some: 'other',
};

const $parentModel = new Object();

const scope = createSimpleScope({
  ... $model,
  $value,
  $propertyName,
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
  function test(value, propertyName, context, neighbours, parentContext) {
    t.equal(value, $value);
    t.equal(propertyName, $propertyName);
    t.deepEqual(context, {
      property: $value,
      some: 'other',
      $value,
      $propertyName,
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
