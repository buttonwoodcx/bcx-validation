import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('switch: switch cases', t => {
  let rule = {
    value: {
      "switch": "type",
      "cases": {
        "string": {validate: "string", minLength: 4},
        "number": ["notMandatory", {validate: "number", min: 10}]
      }
    }
  };

  t.deepEqual(v.validate({value: 'on', type: 'string'}, rule), {
    value: ["must has at least 4 characters"]
  });

  t.deepEqual(v.validate({value: 5, type: 'number'}, rule), {
    value: ["must be at least 10"]
  });

  t.deepEqual(v.validate({value: null, type: 'number'}, rule), {});
  t.end();
});

test('switch: switch cases after if', t => {
  let rule = {
    value: {
      "if": "enforce",
      "switch": "type",
      "cases": {
        "string": {validate: "string", minLength: 4},
        "number": {validate: "number", min: 10}
      }
    }
  };

  t.deepEqual(v.validate({value: 'on', type: 'string', enforce: false}, rule), {});
  t.deepEqual(v.validate({value: 'on', type: 'string', enforce: true}, rule), {
    value: ["must has at least 4 characters"]
  });

  t.deepEqual(v.validate({value: 5, type: 'number', enforce: false}, rule), {});
  t.deepEqual(v.validate({value: 5, type: 'number', enforce: true}, rule), {
    value: ["must be at least 10"]
  });

  t.end();
});
