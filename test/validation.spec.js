import test from 'tape';
import Validation from '../src/validation';
import _ from 'lodash';

const v = new Validation();

test('Validation: validates whole object', t => {
  let rule = {
    name: [
      {validate: "mandatory"},
      {validate: /[a-z]/i, message: "must contain letters"}
    ],
    age: [
      "notMandatory",
      {validate: "number", integer: true, min: 0, max: 99}
    ]
  };

  t.equal(v.validate({name: "hello", age: 20}), undefined);
  t.deepEqual(v.validate({name: "", age: null}, rule), {name: ["must not be empty"]});
  t.deepEqual(v.validate({name: ":-(", age: null}, rule), {name: ["must contain letters"]});

  t.deepEqual(v.validate({name: ":-(", age: "20"}, rule), {
    name: ["must contain letters"],
    age: ["must be a number"]
  });

  t.deepEqual(v.validate({name: "", age: 210.3}, rule), {
    name: ["must not be empty"],
    age: ["must be an integer"]
  });

  t.deepEqual(v.validate({name: "", age: 0}, rule), {
    name: ["must not be empty"]
  });

  t.deepEqual(v.validate({name: "", age: -1}, rule), {
    name: ["must not be empty"],
    age: ["must be at least 0"]
  });

  t.deepEqual(v.validate({name: "", age: 99}, rule), {
    name: ["must not be empty"]
  });

  t.deepEqual(v.validate({name: "", age: 100}, rule), {
    name: ["must not be empty"],
    age: ["must be no more than 99"]
  });

  t.end();
});

test('Validation: can stack rules', t => {
  let rule = [
    {
      name: [
        {validate: "mandatory"}
      ],
      age: [
        "notMandatory",
        {validate: "number", integer: true, min: 0, max: 99}
      ]
    }, {
      name: [
        {validate: "mandatory"},
        {validate: /[a-z]/i, message: "must contain letters"}
      ],
      age: [
        "notMandatory"
      ]
    }
  ];

  t.equal(v.validate({name: "hello", age: 20}), undefined);
  t.deepEqual(v.validate({name: "", age: null}, rule), {name: ["must not be empty"]});
  t.deepEqual(v.validate({name: ":-(", age: null}, rule), {name: ["must contain letters"]});

  t.deepEqual(v.validate({name: ":-(", age: "20"}, rule), {
    name: ["must contain letters"],
    age: ["must be a number"]
  });

  t.deepEqual(v.validate({name: "", age: 210.3}, rule), {
    name: ["must not be empty"],
    age: ["must be an integer"]
  });

  t.deepEqual(v.validate({name: "", age: 0}, rule), {
    name: ["must not be empty"]
  });

  t.deepEqual(v.validate({name: "", age: -1}, rule), {
    name: ["must not be empty"],
    age: ["must be at least 0"]
  });

  t.deepEqual(v.validate({name: "", age: 99}, rule), {
    name: ["must not be empty"]
  });

  t.deepEqual(v.validate({name: "", age: 100}, rule), {
    name: ["must not be empty"],
    age: ["must be no more than 99"]
  });

  t.end();
});

test('Validation: validates nested object', t => {
  let rule = {
    detail: {
      name: [
        {validate: "mandatory"},
        {validate: /[a-z]/i, message: "must contain letters"}
      ],
      age: [
        "notMandatory",
        {validate: "number", integer: true, min: 0, max: 99}
      ]
    },
    id: "mandatory"
  };


  t.deepEqual(v.validate({detail: {name: "", age: 100}}, rule), {
    id: ["must not be empty"],
    detail: {
      name: ["must not be empty"],
      age: ["must be no more than 99"]
    }
  });

  t.deepEqual(v.validate({detail: {name: "", age: 100}, id: 2}, rule), {
    detail: {
      name: ["must not be empty"],
      age: ["must be no more than 99"]
    }
  });

  t.end();
});

test('Validation: validates nested object with key cannot use dot notation (cannot do obj.123)', t => {
  let rule = {
    detail: {
      '1name': [
        {validate: "mandatory"},
        {validate: /[a-z]/i, message: "must contain letters"}
      ],
      2: [
        "notMandatory",
        {validate: "number", integer: true, min: 0, max: 99}
      ]
    },
    id: "mandatory"
  };


  t.deepEqual(v.validate({detail: {'1name': "", 2: 100}}, rule), {
    id: ["must not be empty"],
    detail: {
      '1name': ["must not be empty"],
      2: ["must be no more than 99"]
    }
  });

  t.deepEqual(v.validate({detail: {'1name': "", 2: 100}, id: 2}, rule), {
    detail: {
      '1name': ["must not be empty"],
      2: ["must be no more than 99"]
    }
  });

  t.end();
});

test('Validation: validates deep nested object', t => {
  let rule = {
    meta: {
      detail: {
        name: [
          {validate: "mandatory"},
          {validate: /[a-z]/i, message: "must contain letters"}
        ],
        age: [
          "notMandatory",
          {validate: "number", integer: true, min: 0, max: 99}
        ]
      },
      id: "mandatory"
    }
  };


  t.deepEqual(v.validate({meta: {detail: {name: ":-(", age: 100}}}, rule), {
    meta: {
      id: ["must not be empty"],
      detail: {
        name: ["must contain letters"],
        age: ["must be no more than 99"]
      }
    }
  });

  // generateValidator builds a func
  t.deepEqual(v.generateValidator(rule)({meta: {detail: {name: ":-(", age: 100}}}), {
    meta: {
      id: ["must not be empty"],
      detail: {
        name: ["must contain letters"],
        age: ["must be no more than 99"]
      }
    }
  });

  t.deepEqual(v.validate({meta: {detail: {name: "abc", age: 22}}}, rule), {
    meta: {
      id: ["must not be empty"]
    }
  });

  t.deepEqual(v.validate({meta: {detail: {name: ":-(", age: 100}, id: 2}}, rule), {
    meta: {
        detail: {
        name: ["must contain letters"],
        age: ["must be no more than 99"]
      }
    }
  });

  t.equal(v.validate({meta: {detail: {name: "abc", age: 22}, id: 2}}, rule), undefined);

  t.end();
});

test('Validation: validates instance of constructor func', t => {
  function Model(a, b) {
    this.a = a;
    this.b = b;
  }

  let rule = {
    a: 'mandatory',
    b: {validate: /[a-z]/i, message: "must contain letters"}
  };

  let model = new Model('', '12');

  t.deepEqual(v.validate(model, rule), {
    a: ['must not be empty'],
    b: ['must contain letters']
  });

  t.end();
});

test('Validation: validates simple value', t => {
  let rules = {validate: "number", min: 5};
  t.deepEqual(v.validate(3, rules), ["must be at least 5"]);
  t.end();
});

test('Validation: wraps errors', t => {
  let rules = {validate: "number", min: 5, message: "${_.join($errors, ', ')} to be fit in"};
  t.deepEqual(v.validate(3, rules), ["must be at least 5 to be fit in"]);
  t.end();
});

test('Validation: can add default helper', t => {
  v.addHelper('sum', (a, b) => a + b);
  let rules = {
    a: {validate: 'number', value: 'sum($value, b)', greaterThan: 10, message: "sum(${sum($value, b)}) is not more than 10"}
  };

  t.deepEqual(v.validate({a: 2, b: 3}, rules), {
    a: ["sum(5) is not more than 10"]
  });

  t.end();
});

test('Validation: can add shared helper', t => {
  Validation.addHelper('sum2', (a, b) => a + b);

  let rules = {
    a: {validate: 'number', value: 'sum2($value, b)', greaterThan: 10, message: "sum2(${sum2($value, b)}) is not more than 10"}
  };

  const v = new Validation();
  t.deepEqual(v.validate({a: 2, b: 3}, rules), {
    a: ["sum2(5) is not more than 10"]
  });

  const v2 = new Validation();
  v2.addHelper('sum2', (a, b) => 1 + a + b);
  t.deepEqual(v2.validate({a: 2, b: 3}, rules), {
    a: ["sum2(6) is not more than 10"]
  });

  const v3 = new Validation();
  t.deepEqual(v3.validate({a: 2, b: 3}, rules), {
    a: ["sum2(5) is not more than 10"]
  });

  t.end();
});

test('Validation: user defined transformer works', t => {
  v.addTransformer(
    rule => (rule && _.isString(rule.ifNot) && !_.isEmpty(_.omit(rule, 'ifNot'))),
    rule => {
      const {ifNot, ...others} = rule;
      return {if: `!(${ifNot})`, ...others};
    }
  );

  const rule = {value: {ifNot: "type == 'abc'", validate: "mandatory"}};

  t.equal(v.validate({type: 'abc', value: ''}, rule), undefined);
  t.deepEqual(v.validate({type: 'xyz', value: ''}, rule), {value: ["must not be empty"]});
  t.end();
});

test('Validation: user defined global transformer works', t => {
  Validation.addTransformer(
    rule => (rule && _.isString(rule.ifNot) && !_.isEmpty(_.omit(rule, 'ifNot'))),
    rule => {
      const {ifNot, ...others} = rule;
      return {if: `!(${ifNot})`, ...others};
    }
  );

  const rule = {value: {ifNot: "type == 'abc'", validate: "mandatory"}};
  const v = new Validation();

  t.equal(v.validate({type: 'abc', value: ''}, rule), undefined);
  t.deepEqual(v.validate({type: 'xyz', value: ''}, rule), {value: ["must not be empty"]});
  t.end();
});

test('Validation: user defined validator', t => {
  v.addValidator(
    "allowNA",
    {validate: "skipImmediatelyIf", value: "$value == 'NA'"}
  );

  const rule = {
    value: ['allowNA', {validate: "within", items: ["A", "B"]}]
  };

  t.equal(v.validate({value: 'NA'}, rule), undefined);
  t.deepEqual(v.validate({value: 'C'}, rule), {value: ['must be one of "A", "B"']});
  t.end();
});

test('Validation: user defined global validator', t => {
  Validation.addValidator(
    "allowNA",
    {validate: "skipImmediatelyIf", value: "$value == 'NA'"}
  );

  const rule = {
    value: ['allowNA', {validate: "within", items: ["A", "B"]}]
  };
  const v = new Validation();

  t.equal(v.validate({value: 'NA'}, rule), undefined);
  t.deepEqual(v.validate({value: 'C'}, rule), {value: ['must be one of "A", "B"']});
  t.end();
});

test('Validation: user defined validator with function can access option', t => {
  v.addValidator("atLeast", (value, propertyPath, context, get) => {
    const length = get("$length") || 8; // default to 8

    if (!(value && value.length >= length)) {
      return `must be at least ${length} characters long`;
    }
  });

  t.deepEqual(v.validate("abc", "atLeast"), ["must be at least 8 characters long"]);
  t.equal(v.validate("abc", {validate: "atLeast", length: 2}), undefined);
  t.deepEqual(v.validate("a", {validate: "atLeast", length: 2}), ["must be at least 2 characters long"]);
  t.end();
});

test('Validation: user defined global validator with function can access option', t => {
  Validation.addValidator("atLeast", (value, propertyPath, context, get) => {
    const length = get("$length") || 8; // default to 8

    if (!(value && value.length >= length)) {
      return `must be at least ${length} characters long`;
    }
  });

  const v = new Validation();

  t.deepEqual(v.validate("abc", "atLeast"), ["must be at least 8 characters long"]);
  t.equal(v.validate("abc", {validate: "atLeast", length: 2}), undefined);
  t.deepEqual(v.validate("a", {validate: "atLeast", length: 2}), ["must be at least 2 characters long"]);
  t.end();
});

test('Validation: user defined validator can overwrite existing validator', t => {
  v.addValidator(
    "isTrue",
    v => v ? null : "--not-true--"
  );

  const rule = {a: "isTrue"};

  t.equal(v.validate({a: true}, rule), undefined);
  t.deepEqual(v.validate({a: false}, rule), {a: ["--not-true--"]});
  t.end();
});

test('Validation: value override can access options', t => {
  t.equal(v.validate(3, {validate: 'isTrue', value: '$value > $lowerLimit', lowerLimit: 2, message: 'must be greater than ${$lowerLimit}'}), undefined);
  // TODO to support {message: 'must be greater than ${$lowerLimit}'}
  t.deepEqual(v.validate(3, {validate: 'isTrue', value: '$value > $lowerLimit', lowerLimit: 5, message: 'must be greater than 5'}), ['must be greater than 5']);
  t.end();
});