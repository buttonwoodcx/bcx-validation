import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('passImmediatelyIf: pass immediately', t => {
  let rule = {
    a: [
      {validate: 'passImmediatelyIf'},
      {validate: /^good/, message: 'not good :-('}
    ]
  };

  t.deepEqual(v.validate({a: ""}, rule), {a: ['not good :-(']});
  t.deepEqual(v.validate({a: "bad"}, rule), {});
  t.deepEqual(v.validate({a: "good"}, rule), {});

  rule = {
    a: [
      {validate: 'passImmediatelyIf', value: "!$value"},
      {validate: /^good/, message: 'not good :-('}
    ]
  };

  t.deepEqual(v.validate({a: ""}, rule), {});
  t.deepEqual(v.validate({a: "bad"}, rule), {a: ['not good :-(']});
  t.deepEqual(v.validate({a: "good"}, rule), {});

  t.end();
});

test('failImmediatelyIf: fail immediately', t => {
  let rule = {
    a: [
      {validate: 'failImmediatelyIf', message: "should be false!"},
      {validate: /^good/, message: 'not good :-('}
    ]
  };

  t.deepEqual(v.validate({a: ""}, rule), {a: ['not good :-(']});
  t.deepEqual(v.validate({a: "bad"}, rule), {a: ['should be false!']});
  t.deepEqual(v.validate({a: "good"}, rule), {a: ['should be false!']});

  rule = {
    a: [
      {validate: 'failImmediatelyIf', value: "!$value", message: "should be true!"},
      {validate: /^good/, message: 'not good :-('}
    ]
  };

  t.deepEqual(v.validate({a: ""}, rule), {a: ['should be true!']});
  t.deepEqual(v.validate({a: "bad"}, rule), {a: ['not good :-(']});
  t.deepEqual(v.validate({a: "good"}, rule), {});

  t.end();
});

