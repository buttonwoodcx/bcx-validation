import test from 'tape';
import _ from 'lodash';
import standardValidatorWrap from '../src/standard-validator-wrap';

const w = standardValidatorWrap;

test('standardValidatorWrap: normalize validator output to ValidationResult', t => {
  t.deepEqual(w(() => undefined)(), {isValid: true});
  t.deepEqual(w(() => "foo")(), {isValid: false, errors: ['foo']});
  t.deepEqual(w(() => ['foo', 'bar'])(), {isValid: false, errors: ['foo', 'bar']});
  t.end();
});
