import test from 'tape';
import _ from 'lodash';
import standardValidatorWrap from '../src/standard-validator-wrap';
import valueEvaluator from '../src/value-evaluator';
import scopeVariation from '../src/scope-variation';
import {createSimpleScope} from 'bcx-expression-evaluator';

const w = standardValidatorWrap;

test('standardValidatorWrap: normalizes validator output to ValidationResult', t => {
  t.deepEqual(w(() => undefined)(), {isValid: true});
  t.deepEqual(w(() => "foo")(), {isValid: false, errors: ['foo']});
  t.deepEqual(w(() => ['foo', 'bar'])(), {isValid: false, errors: ['foo', 'bar']});
  t.end();
});

test('standardValidatorWrap: forces break', t => {
  t.deepEqual(w(() => undefined, {stopValidationChainIfPass: true})(), {isValid: true, break: true});
  t.deepEqual(w(() => undefined, {stopValidationChainIfFail: true})(), {isValid: true});
  t.deepEqual(w(() => "foo", {stopValidationChainIfPass: true})(), {isValid: false, errors: ['foo']});
  t.deepEqual(w(() => "foo", {stopValidationChainIfFail: true})(), {isValid: false, errors: ['foo'], break: true});
  t.deepEqual(w(() => ['foo', 'bar'], {stopValidationChainIfPass: true})(), {isValid: false, errors: ['foo', 'bar']});
  t.deepEqual(w(() => ['foo', 'bar'], {stopValidationChainIfFail: true})(), {isValid: false, errors: ['foo', 'bar'], break: true});
  t.end();
});

test('standardValidatorWrap: overrides error message', t => {
  const s = createSimpleScope({});
  t.deepEqual(w(() => "foo", {message: 'bar'})(s), {isValid: false, errors: ['bar']});
  t.end();
});

test('standardValidatorWrap: overrides error message with string interoperation', t => {
  const s = createSimpleScope({});
  s.overrideContext.$value = 'test';
  t.deepEqual(w({
    $patchScope: scope => scopeVariation(scope, {$value: 'lorem'}),
    $validator: () => "foo"
  }, {message: "${$value} bar ${$errors.join(',')}"})(s), {isValid: false, errors: ['test bar foo']});
  t.end();
});

test('standardValidatorWrap: overrides error message with function', t => {
  const s = createSimpleScope({});
  s.overrideContext.$value = 'test';
  t.deepEqual(w(() => "foo", {message: v => v + ' is invalid'})(s), {isValid: false, errors: ['test is invalid']});
  t.end();
});

test('standardValidatorWrap: patches scope', t => {
  const validator = {
    $validator: scope => {
      const value = valueEvaluator('$value')(scope);
      const min = valueEvaluator('$min')(scope);
      if (value < min) {
        return "foo";
      }
    },
    $patchScope: scope => {
      return scopeVariation(scope, {$value: valueEvaluator('$value.length')(scope), $min: 4});
    }
  };

  const good = createSimpleScope({});
  good.overrideContext.$value = 'good';
  const bad = createSimpleScope({});
  bad.overrideContext.$value = 'bad';
  t.deepEqual(w(validator)(good), {isValid: true});
  t.deepEqual(w(validator, {message: 'length of ${$value} is less than ${$min}'})(good), {isValid: true});
  t.deepEqual(w(validator)(bad), {isValid: false, errors: ['foo']});
  t.deepEqual(w(validator, {message: '${$errors.join(",")}: length of ${$value} is less than ${$min}'})(bad), {isValid: false, errors: ['foo: length of bad is less than 4']});
  t.end();
});
