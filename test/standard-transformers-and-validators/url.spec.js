import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('url: tests url', t => {
  let rule = {a: {validate: "url"}};
  t.deepEqual(v.validate({a: 'c'}, rule), {a: ["not a valid URL"]});
  t.deepEqual(v.validate({a: 'ftp://xyz.com/file.tar.gz'}, rule), {a: ["not a valid URL"]});
  t.equal(v.validate({a: 'https://t'}, rule), undefined);
  t.equal(v.validate({a: 'https://t?q=1#hash'}, rule), undefined);
  t.deepEqual(v.validate({a: 'https://t?q= 1'}, rule), {a: ["not a valid URL, white space must be escaped"]});

  // shortcut
  rule = {a: "url"};
  t.deepEqual(v.validate({a: 'c'}, rule), {a: ["not a valid URL"]});
  t.equal(v.validate({a: 'http://10.1.1.2'}, rule), undefined);
  t.end();
});
