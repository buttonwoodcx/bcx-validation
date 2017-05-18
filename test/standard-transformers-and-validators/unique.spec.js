import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('unique: tests unique across neighbours', t => {
  let rule = {
    customers: {
      foreach: {
        name: ["mandatory", "unique"]
      }
    }
  };

  t.deepEqual(v.validate({
    customers: [
      {name: 'Bob'},
      {name: 'Ali'},
      {name: 'Bob'},
      {name: ' '},
      {name: 'Cloc'}
    ]
  }, rule), {
    customers: {
      '0': {name: ['must be unique']},
      '2': {name: ['must be unique']},
      '3': {name: ['must not be empty']}
    }
  });

  t.end();
});

test('unique: tests unique across neighbours on primitive value', t => {
  let rule = {
    customers: {
      foreach: ["mandatory", "unique"]
    }
  };

  t.deepEqual(v.validate({
    customers: ['Bob', 'Ali', 'Bob', ' ', 'Cloc']
  }, rule), {
    customers: {
      '0': ['must be unique'],
      '2': ['must be unique'],
      '3': ['must not be empty']
    }
  });

  t.end();
});

test('unique: works behind nested rule', t => {
  let rule = {
    meta: {
      customers: {
        foreach: {
          details: {name: ["mandatory", "unique"]}
        }
      }
    }
  };

  t.deepEqual(v.validate({
    meta: {
      customers: [
        {details: {name: 'Bob'}},
        {details: {name: 'Ali'}},
        {details: {name: 'Bob'}},
        {details: {name: ' '}},
        {details: {name: 'Cloc'}}
      ]
    }
  }, rule), {
    meta: {
      customers: {
        '0': {details: {name: ['must be unique']}},
        '2': {details: {name: ['must be unique']}},
        '3': {details: {name: ['must not be empty']}}
      }
    }
  });

  t.end();
});

