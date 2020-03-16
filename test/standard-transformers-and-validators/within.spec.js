import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('within: tests wthin', t => {
  let rule = {a: {validate: "within", items:['a', 'b']}};
  t.deepEqual(v.validate({a: 'c'}, rule), {a: ["must be one of a, b"]});
  t.equal(v.validate({a: 'b'}, rule), undefined);
  t.deepEqual(v.validate({a: 'B'}, rule), {a: ["must be one of a, b"]});
  t.end();
});

test('within: tests wthin case insensitively', t => {
  let rule = {a: {validate: "within", items:['a', 'b'], caseInsensitive: true}};
  t.deepEqual(v.validate({a: 'c'}, rule), {a: ["must be one of a, b"]});
  t.equal(v.validate({a: 'b'}, rule), undefined);
  t.equal(v.validate({a: 'B'}, rule), undefined);
  t.end();
});

test('within: tests wthin with runtime bind', t => {
  let rule = {a: {validate: "within", 'items.bind': "$input.split(',')", input:'a,b', caseInsensitive: true}};
  t.deepEqual(v.validate({a: 'c'}, rule), {a: ["must be one of a, b"]});
  t.equal(v.validate({a: 'b'}, rule), undefined);
  t.equal(v.validate({a: 'B'}, rule), undefined);
  t.end();
});

test('notIn: tests not within', t => {
  let rule = {a: {validate: "notIn", items:['a', 'b']}};
  t.equal(v.validate({a: 'c'}, rule), undefined);
  t.deepEqual(v.validate({a: 'b'}, rule), {a: ["must not be one of a, b"]});
  t.equal(v.validate({a: 'B'}, rule),undefined);
  t.end();
});


test('notIn: tests not within case insensitively', t => {
  let rule = {a: {validate: "notIn", items:['a', 'b'], caseInsensitive: true}};
  t.equal(v.validate({a: 'c'}, rule), undefined);
  t.deepEqual(v.validate({a: 'b'}, rule), {a: ["must not be one of a, b"]});
  t.deepEqual(v.validate({a: 'B'}, rule), {a: ["must not be one of a, b"]});
  t.end();
});
