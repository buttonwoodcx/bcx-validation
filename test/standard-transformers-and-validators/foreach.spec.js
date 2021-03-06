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

test('foreach: can access parent context', t => {
  let rule = {
    customers: {
      foreach: {
        email: "email",
        name: ["mandatory", "unique"],
        age: ["notMandatory", {validate: 'number', "min.bind": "ageLimit"}]
      }
    }
  };

  const obj = {
    ageLimit: 21,
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
      "2": {name: ["must be unique"], email:["not a valid email"], age: ["must be at least 21"]},
      "3": {name: ["must not be empty"], email:["not a valid email"], age: ["must be at least 21"]}
    }
  });

  t.end();
});

test('foreach: can access parent context explictly', t => {
  let rule = {
    customers: {
      foreach: {
        email: "email",
        name: ["mandatory", "unique"],
        age: ["notMandatory", {validate: 'number',
                               "min.bind": "ageLimit",
                               message: "${$parent.name} must be at least ${ageLimit} years old"}]
      }
    }
  };

  const obj = {
    name: 'driver group',
    ageLimit: 21,
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
      "2": {name: ["must be unique"], email:["not a valid email"], age: ["driver group must be at least 21 years old"]},
      "3": {name: ["must not be empty"], email:["not a valid email"], age: ["driver group must be at least 21 years old"]}
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

test('foreach: validates array with a function return rulesMap. key can be function too.', t => {
  let rule = {
    users: {
      foreach: (user) => {
        switch(_.get(user, 'type')) {
          case 'customer':
            return {
              email: ["notMandatory", "email"],
              phone: ["notMandatory", "unique"],
              name: ["mandatory", "unique"],
              age: ["notMandatory", {validate: 'number', min: 16}]
            };
          case 'dealer':
            return {
              dealerId: ["mandatory", "unique"],
              phone: ["mandatory", "unique"],
              email: ["mandatory", "email"],
              name: ["mandatory", "unique"]
            };
        }
      },
      key: (user) => '#' + _.get(user, 'id')
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
      '#d01': {
        phone: ['must not be empty'],
        dealerId: ['must not be empty'],
      },
      '#c02': {
        name: ['must be unique']
      },
      '#c03': {
        name: ['must be unique'],
        email: ['not a valid email'],
        age: ['must be at least 16']
      },
      '#c04': {
        name: ['must not be empty'],
      },
      '#d02': {
        dealerId: ['must be unique'],
        name: ['must be unique'],
        email: ['not a valid email'],
        phone: ['must be unique']
      },
      '#d03': {
        dealerId: ['must be unique'],
        name: ['must be unique'],
        phone: ['must be unique']
      }
    }
  });

  t.end();
});

test('foreach: validates array with array of (function return rulesMap) or plain rulesMap. key can be function too.', t => {
  let rule = {
    users: {
      foreach: [
        (user) => {
          switch(_.get(user, 'type')) {
            case 'customer':
              return {
                phone: ["notMandatory", "unique"],
                name: ["mandatory", "unique"],
                age: ["notMandatory", {validate: 'number', min: 16}]
              };
            case 'dealer':
              return {
                dealerId: ["mandatory", "unique"],
                phone: ["mandatory", "unique"],
                name: ["mandatory", "unique"]
              };
          }
        },
        // additional validation on email
        {
          switch: 'type',
          cases: {
            customer: {
              email: ["notMandatory", "email"]
            },
            dealer: {
              email: ["mandatory", "email"]
            }
          }
        }
      ],
      key: (user) => '#' + _.get(user, 'id')
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
      '#d01': {
        phone: ['must not be empty'],
        dealerId: ['must not be empty'],
      },
      '#c02': {
        name: ['must be unique']
      },
      '#c03': {
        name: ['must be unique'],
        email: ['not a valid email'],
        age: ['must be at least 16']
      },
      '#c04': {
        name: ['must not be empty'],
      },
      '#d02': {
        dealerId: ['must be unique'],
        name: ['must be unique'],
        email: ['not a valid email'],
        phone: ['must be unique']
      },
      '#d03': {
        dealerId: ['must be unique'],
        name: ['must be unique'],
        phone: ['must be unique']
      }
    }
  });

  t.end();
});

test('foreach: validates simple array', t => {
  let rule = {
    tags: {
      foreach: ["notBlank", "unique"]
    }
  };

  const obj = {
    tags: ["foo", "  ", "bar", "bar", "lorem"]
  };

  t.deepEqual(v.validate(obj, rule), {
    tags: {
      "1": ["must not be blank"],
      "2": ["must be unique"],
      "3": ["must be unique"]
    }
  });

  t.end();
});

test('foreach: support multiple switch, merges result, removes duplicates', t => {
  let rule = {
    users: {
      foreach: [{
        switch: 'type',
        cases: {
          customer: {
            email: ["notMandatory", "email"],
            phone: ["notMandatory", "unique"],
            name: ["mandatory", "unique"],
            age: ["notMandatory", {validate: 'number', min: 16}]
          },
        }
      },
      {
        switch: 'type',
        cases: {
          customer: {
            email: ["notMandatory", "email"],
            name: ["mandatory", "unique", {validate: 'string', minLength: 2}],
          },
          dealer: {
            dealerId: ["mandatory", "unique"],
            phone: ["mandatory", "unique"],
            email: ["mandatory", "email"],
            name: ["mandatory", "unique"]
          }
        }
      }],
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
      {id: 'c05', type: 'customer', name: 'X', email: 'x', age: 15},

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
      c05: {
        name: ['must have at least 2 characters'],
        email: ['not a valid email'],
        age: ['must be at least 16']
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
