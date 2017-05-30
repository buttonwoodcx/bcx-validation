import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('contain: tests contain items', t => {
  let rule = {a: {validate: "contain", items:['a', 'b']}};
  t.deepEqual(v.validate({a: ['a', 'c']}, rule), {a: ["missing b"]});
  t.equal(v.validate({a: ['a', 'b', 'c']}, rule), undefined);
  t.end();
});

test('contain: tests contain item', t => {
  let rule = {a: {validate: "contain", item: 'b'}};
  t.deepEqual(v.validate({a: ['a', 'c']}, rule), {a: ["must contain b"]});
  t.equal(v.validate({a: ['a', 'b', 'c']}, rule), undefined);
  t.end();
});

