import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('regex: tests regex', t => {
  t.deepEqual(v.validate(null, {validate: /\d/}), ["invalid format"]);
  t.deepEqual(v.validate("abc", {validate: /\d/}), ["invalid format"]);
  t.deepEqual(v.validate("abc", {validate: /\d/, message: 'needs digit'}), ["needs digit"]);
  t.equal(v.validate("ab5c", {validate: /\d/}), undefined);
  t.end();
});

test('regex: tests bare regex', t => {
  t.deepEqual(v.validate(null, /\d/), ["invalid format"]);
  t.deepEqual(v.validate("abc", /\d/), ["invalid format"]);
  t.equal(v.validate("ab5c", /\d/), undefined);
  t.end();
});
