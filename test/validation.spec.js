import test from 'tape';
import Validation from '../src/validation';
import _ from 'lodash';

const v = new Validation();

test('Validate: validates whole object', t => {
  let rule = {
    name: [
      {validate: "mandatory"},
      {validate: /[a-z]/i, message: "must only contain letters"}
    ],
    age: [
      "notMandatory",
      {validate: "number", integer: true, min: 0, max: 99}
    ]
  };

  t.deepEqual(v.validate({name: "hello", age: 20}), {});
  t.deepEqual(v.validate({name: "", age: null}, rule), {name: ["must not be empty"]});
  t.deepEqual(v.validate({name: ":-(", age: null}, rule), {name: ["must only contain letters"]});

  t.deepEqual(v.validate({name: ":-(", age: "20"}, rule), {
    name: ["must only contain letters"],
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

test('Validate: validates nested object', t => {
  let rule = {
    detail: {
      name: [
        {validate: "mandatory"},
        {validate: /[a-z]/i, message: "must only contain letters"}
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

test('Validate: validates deep nested object', t => {
  let rule = {
    meta: {
      detail: {
        name: [
          {validate: "mandatory"},
          {validate: /[a-z]/i, message: "must only contain letters"}
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
        name: ["must only contain letters"],
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
        name: ["must only contain letters"],
        age: ["must be no more than 99"]
      }
    }
  });

  t.deepEqual(v.validate({meta: {detail: {name: "abc", age: 22}, id: 2}}, rule), {});

  t.end();
});
