import test from 'tape';
import valueEvaluator from '../src/value-evaluator';
import proxy from 'contextual-proxy';
import _ from 'lodash';

const $value = "abc";
const $propertyPath = "property";
const $neighbours = [new Object(), new Object()];

const $model = {
  property: $value,
  some: 'other',
};

const $parentModel = new Object();

let scope = proxy($model, $parentModel, {
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
  function test(value, propertyPath, context, get) {
    t.equal(value, $value);
    t.equal(propertyPath, $propertyPath);
    t.deepEqual(context, $model);

    t.deepEqual(get('$neighbours'), $neighbours);
    t.equal(get('$parent'), $parentModel);
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
