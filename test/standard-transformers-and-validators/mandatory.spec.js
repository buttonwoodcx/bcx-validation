import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('mandatory: fail immediately if blank', t => {
  let rule = {a: [{validate: "mandatory"}, {validate: "number"}]};
  t.deepEqual(v.validate({a: undefined}, rule), {a: ["must not be empty"]});
  t.deepEqual(v.validate({a: null}, rule), {a: ["must not be empty"]});
  t.deepEqual(v.validate({a: []}, rule), {a: ["must not be empty"]});
  t.deepEqual(v.validate({a: {}}, rule), {a: ["must not be empty"]});
  t.deepEqual(v.validate({a: ""}, rule), {a: ["must not be empty"]});
  t.deepEqual(v.validate({a: " \t  "}, rule), {a: ["must not be empty"]});

  t.deepEqual(v.validate({a: 0}, rule), {});
  t.deepEqual(v.validate({a: /a/}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: new Date()}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: [null]}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: {a: undefined}}, rule), {a: ["must be a number"]});

  // mandatory has a shortcut
  rule = {a: ["mandatory", {validate: "number"}]};
  t.deepEqual(v.validate({a: undefined}, rule), {a: ["must not be empty"]});
  t.deepEqual(v.validate({a: 0}, rule), {});
  t.deepEqual(v.validate({a: /a/}, rule), {a: ["must be a number"]});
  t.end();
});

test('notMandatory: skip immediately if blank', t => {
  let rule = {a: [{validate: "notMandatory"}, {validate: "number"}]};
  t.deepEqual(v.validate({a: undefined}, rule), {});
  t.deepEqual(v.validate({a: null}, rule), {});
  t.deepEqual(v.validate({a: []}, rule), {});
  t.deepEqual(v.validate({a: {}}, rule), {});
  t.deepEqual(v.validate({a: ""}, rule), {});
  t.deepEqual(v.validate({a: " \t  "}, rule), {});

  t.deepEqual(v.validate({a: 0}, rule), {});
  t.deepEqual(v.validate({a: /a/}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: new Date()}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: [null]}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: {a: undefined}}, rule), {a: ["must be a number"]});

  // notMandatory has a shortcut
  rule = {a: ["notMandatory", {validate: "number"}]};
  t.deepEqual(v.validate({a: undefined}, rule), {});
  t.deepEqual(v.validate({a: 0}, rule), {});
  t.deepEqual(v.validate({a: /a/}, rule), {a: ["must be a number"]});
  t.end();
});


