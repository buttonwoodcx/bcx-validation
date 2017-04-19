import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('foreach: validates array', t => {
  let rule = {
    customers: {
      foreach: {
        email: "email",
        name: ["mandatory", "unique"],
        age: ["notMandatory", {validate: 'number', min: 16}]
      }
    }
  };

  const obj = {
    customers: [
      {name: 'Arm', email: 'arm@test.com'},
      {name: 'Bob', email: 'bob@test.com'},
      {name: 'Bob', email: 'bob', age: 15},
      {name: '', age: 18}
    ]
  };

  t.deepEqual(v.validate(obj, rule), {
    customers: {
      "1": {name: ["must be unique"]},
      "2": {name: ["must be unique"], email:["not a valid email"], age: ["must be at least 16"]},
      "3": {name: ["must not be empty"], email:["not a valid email"]}
    }
  });

  t.end();
});

test('foreach: validates array with customized key', t => {
  let rule = {
    customers: {
      foreach: {
        email: "email",
        name: ["mandatory", "unique"],
        age: ["notMandatory", {validate: 'number', min: 16}]
      },
      key: "id"
    }
  };

  const obj = {
    customers: [
      {id: 'aa', name: 'Arm', email: 'arm@test.com'},
      {id: 'ab', name: 'Bob', email: 'bob@test.com'},
      {id: 'ac', name: 'Bob', email: 'bob', age: 15},
      {id: 'ad', name: '', age: 18}
    ]
  };

  t.deepEqual(v.validate(obj, rule), {
    customers: {
      "ab": {name: ["must be unique"]},
      "ac": {name: ["must be unique"], email:["not a valid email"], age: ["must be at least 16"]},
      "ad": {name: ["must not be empty"], email:["not a valid email"]}
    }
  });

  t.end();
});

test('foreach: validates array with type switch', t => {
  let rule = {
    users: {
      foreach: {
        switch: 'type',
        cases: {
          customer: {
            email: ["notMandatory", "email"],
            phone: ["notMandatory", "unique"],
            name: ["mandatory", "unique"],
            age: ["notMandatory", {validate: 'number', min: 16}]
          },
          dealer: {
            dealerId: ["mandatory", "unique"],
            phone: ["mandatory", "unique"],
            email: ["mandatory", "email"],
            name: ["mandatory", "unique"]
          }
        }
      },
      key: "id"
    }
  };

  const obj = {
    users: [
      {id: 'c01', type: 'customer', name: 'Arm', email: 'arm@test.com'},

      {id: 'd01', type: 'dealer', name: 'Dealer A', email: 'arm@test.com'},

      {id: 'c02', type: 'customer', name: 'Bob', email: 'bob@test.com'},
      {id: 'c03', type: 'customer', name: 'Bob', email: 'bob', age: 15},
      {id: 'c04', type: 'customer', name: '', age: 18},

      {id: 'd02', dealerId: 'dealer.b', type: 'dealer', name: 'Dealer B', email: 'on', phone: '02123'},
      {id: 'd03', dealerId: 'dealer.b', type: 'dealer', name: 'Dealer B', email: 'b@test.com', phone: '02123'},
      {id: 'd04', dealerId: 'dealer.d', type: 'dealer', name: 'Dealer D', email: 'd@test.com', phone: '964324'},
    ]
  };

  t.deepEqual(v.validate(obj, rule), {
    users: {
      d01: {
        phone: ['must not be empty'],
        dealerId: ['must not be empty'],
      },
      c02: {
        name: ['must be unique']
      },
      c03: {
        name: ['must be unique'],
        email: ['not a valid email'],
        age: ['must be at least 16']
      },
      c04: {
        name: ['must not be empty'],
      },
      d02: {
        dealerId: ['must be unique'],
        name: ['must be unique'],
        email: ['not a valid email'],
        phone: ['must be unique']
      },
      d03: {
        dealerId: ['must be unique'],
        name: ['must be unique'],
        phone: ['must be unique']
      }
    }
  });

  t.end();
});
