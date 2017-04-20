import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

// pass minLength, maxLength to sub validator:"string"
test('password: tests minLength, maxLength', t => {
  let rule = {a: {validate: "password", minLength: 4, maxLength: 8}};
  t.deepEqual(v.validate({a: '02'}, rule), {a: ["must have at least 4 characters"]});
  t.deepEqual(v.validate({a: '12345'}, rule), {});
  t.deepEqual(v.validate({a: '123456789'}, rule), {a: ["must be no more than 8 characters"]});
  t.end();
});

test('password: tests alphabet', t => {
  let rule = {a: {validate: "password", alphabet: true}};
  t.deepEqual(v.validate({a: '02'}, rule), {a: ["must contain alphabet letter"]});
  t.deepEqual(v.validate({a: '4c5'}, rule), {});
  t.end();
});

test('password: tests mixCase', t => {
  let rule = {a: {validate: "password", mixCase: true}};
  t.deepEqual(v.validate({a: '0'}, rule), {a: ["must contain both lower case and upper case letters"]});
  t.deepEqual(v.validate({a: '0a'}, rule), {a: ["must contain both lower case and upper case letters"]});
  t.deepEqual(v.validate({a: '4cB5'}, rule), {});
  t.end();
});

test('password: tests digit', t => {
  let rule = {a: {validate: "password", digit: true}};
  t.deepEqual(v.validate({a: '0'}, rule), {});
  t.deepEqual(v.validate({a: 'ba'}, rule), {a: ["must contain number"]});
  t.deepEqual(v.validate({a: '4cB5'}, rule), {});
  t.end();
});

test('password: tests specialChar', t => {
  let rule = {a: {validate: "password", specialChar: true}};
  t.deepEqual(v.validate({a: 'ba'}, rule), {a: ["must contain special character (like !@$%)"]});
  t.deepEqual(v.validate({a: '4%5'}, rule), {});
  t.end();
});

test('password: tests all', t => {
  let rule = {a: {validate: "password", minLength: 4, maxLength: 8, alphabet: true, mixCase: true, digit: true, specialChar: true}};
  t.deepEqual(v.validate({a: '02'}, rule), {a: [
    'must have at least 4 characters',
    'must contain alphabet letter',
    'must contain both lower case and upper case letters',
    'must contain special character (like !@$%)'
  ]});
  t.deepEqual(v.validate({a: '0abC%--on2'}, rule), {a: ["must be no more than 8 characters"]});
  t.deepEqual(v.validate({a: '0aC%on2'}, rule), {});
  t.end();
});
