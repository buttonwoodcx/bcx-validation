import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('number: tests number', t => {
  let rule = {a: {validate: "number"}};
  t.deepEqual(v.validate({a: "1"}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: 1}, rule), {});
  t.deepEqual(v.validate({a: 1.2}, rule), {});
  t.end();
});

test('number: tests integer', t => {
  let rule = {a: {validate: "number", integer: true}};
  t.deepEqual(v.validate({a: "1"}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: 1}, rule), {});
  t.deepEqual(v.validate({a: 1.2}, rule), {a: ["must be an integer"]});
  t.end();
});

test('number: tests min', t => {
  let rule = {a: {validate: "number", min: 2.1}};
  t.deepEqual(v.validate({a: "1"}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: 1}, rule), {a: ["must be at least 2.1"]});
  t.deepEqual(v.validate({a: 2.1}, rule), {});

  rule = {a: {validate: "number", integer: true, min: 3}};
  t.deepEqual(v.validate({a: "1"}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: 1}, rule), {a: ["must be at least 3"]});
  t.deepEqual(v.validate({a: 2.1}, rule), {a: ["must be an integer"]});
  t.deepEqual(v.validate({a: 3}, rule), {});
  t.deepEqual(v.validate({a: 4}, rule), {});
  t.end();
});

test('number: tests max', t => {
  let rule = {a: {validate: "number", max: 2.1}};
  t.deepEqual(v.validate({a: "1"}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: 1}, rule), {});
  t.deepEqual(v.validate({a: 2.2}, rule), {a: ["must be no more than 2.1"]});

  rule = {a: {validate: "number", integer: true, max: 3}};
  t.deepEqual(v.validate({a: "1"}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: 1}, rule), {});
  t.deepEqual(v.validate({a: 2.1}, rule), {a: ["must be an integer"]});
  t.deepEqual(v.validate({a: 3}, rule), {});
  t.deepEqual(v.validate({a: 4}, rule), {a: ["must be no more than 3"]});

  rule = {a: {validate: "number", integer: true, min: 1, max: 3}};
  t.deepEqual(v.validate({a: "1"}, rule), {a: ["must be a number"]});
  t.deepEqual(v.validate({a: 1}, rule), {});
  t.deepEqual(v.validate({a: 2.1}, rule), {a: ["must be an integer"]});
  t.deepEqual(v.validate({a: 3}, rule), {});
  t.deepEqual(v.validate({a: 4}, rule), {a: ["must be no more than 3"]});
  t.deepEqual(v.validate({a: 0}, rule), {a: ["must be at least 1"]});

  // bad rule
  rule = {a: {validate: "number", integer: true, min: 5, max: 3}};
  t.deepEqual(v.validate({a: 4}, rule), {a: ["must be at least 5", "must be no more than 3"]});
  t.end();
});

test('number: tests greaterThan', t => {
  let rule = {a: {validate: "number", greaterThan: 2.1}};
  t.deepEqual(v.validate({a: 2.1}, rule), {a: ["must be greater than 2.1"]});
  t.deepEqual(v.validate({a: 2.2}, rule), {});
  t.end();
});

test('number: tests lessThan', t => {
  let rule = {a: {validate: "number", lessThan: 2.1}};
  t.deepEqual(v.validate({a: 2.1}, rule), {a: ["must be less than 2.1"]});
  t.deepEqual(v.validate({a: 2}, rule), {});
  t.end();
});

test('number: tests even', t => {
  let rule = {a: {validate: "number", even: true}};
  t.deepEqual(v.validate({a: 1}, rule), {a: ["must be an even number"]});
  t.deepEqual(v.validate({a: 2}, rule), {});
  t.end();
});

test('number: tests odd', t => {
  let rule = {a: {validate: "number", odd: true}};
  t.deepEqual(v.validate({a: 2}, rule), {a: ["must be an odd number"]});
  t.deepEqual(v.validate({a: 1}, rule), {});

  rule = {a: {validate: "number", min: 3, odd: true}};
  t.deepEqual(v.validate({a: 2}, rule), {a: ["must be at least 3", "must be an odd number"]});
  t.end();
});

test('number: overrides value', t => {
  let rule = {a: {validate: "number", value: "_.size($value)", min: 2, message: "must have at least 2 items"}};
  t.deepEqual(v.validate({a: []}, rule), {a: ["must have at least 2 items"]});
  t.deepEqual(v.validate({a: [1,2]}, rule), {});
  t.end();
});
