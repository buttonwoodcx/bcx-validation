import test from 'tape';
import valueEvaluator from '../src/value-evaluator';
import {createSimpleScope} from 'bcx-expression-evaluator';
import _ from 'lodash';

const $value = "abc";
const $propertyPath = "property";
const $neighbours = [new Object(), new Object()];

const $model = {
  property: $value,
  some: 'other',
};

const $parentModel = new Object();

let scope = createSimpleScope($model, $parentModel);
_.merge(scope.overrideContext, {
  $value,
  $propertyPath,
  $neighbours
});

test('valueEvaluator: builds for string', t => {
  t.equal(valueEvaluator(''), undefined);

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
    t.deepEqual(context, $model);

    t.deepEqual(neighbours, $neighbours);
    t.equal(parentContext, $parentModel);
    t.end();
  }

  let e = valueEvaluator(test);
  e(scope);
});

test('valueEvaluator: rejects unknown input', t => {
  t.equal(valueEvaluator(), undefined);
  t.equal(valueEvaluator(null), undefined);
  t.equal(valueEvaluator([]), undefined);
  t.equal(valueEvaluator({}), undefined);
  t.end();
});
