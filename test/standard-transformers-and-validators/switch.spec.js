import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('switch: switch cases with expression', t => {
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
    value: ["must have at least 4 characters"]
  });

  t.deepEqual(v.validate({value: 5, type: 'number'}, rule), {
    value: ["must be at least 10"]
  });

  t.deepEqual(v.validate({value: null, type: 'number'}, rule), {});
  t.end();
});

test('switch: switch cases with func', t => {
  let rule = {
    value: {
      "switch": (v, path, obj) => obj.type,
      "cases": {
        "string": {validate: "string", minLength: 4},
        "number": ["notMandatory", {validate: "number", min: 10}]
      }
    }
  };

  t.deepEqual(v.validate({value: 'on', type: 'string'}, rule), {
    value: ["must have at least 4 characters"]
  });

  t.deepEqual(v.validate({value: 5, type: 'number'}, rule), {
    value: ["must be at least 10"]
  });

  t.deepEqual(v.validate({value: null, type: 'number'}, rule), {});
  t.end();
});

test('switch: switch cases on nested validation', t => {
  let rule = {
    meta: {
      "switch": "type",
      "cases": {
        "string": {value: {validate: "string", minLength: 4}},
        "number": {value: ["notMandatory", {validate: "number", min: 10}]}
      }
    }
  };

  t.deepEqual(v.validate({meta: {value: 'on', type: 'string'}}, rule), {
    meta: {value: ["must have at least 4 characters"]}
  });

  t.deepEqual(v.validate({meta: {value: 5, type: 'number'}}, rule), {
    meta: {value: ["must be at least 10"]}
  });

  t.deepEqual(v.validate({meta: {value: null, type: 'number'}}, rule), {});
  t.end();
});

test('switch: complex switch cases on nested validation', t => {
  let rule = {
    meta: {
      "switch": "domain + ':' + type",
      "cases": {
        "admin:string": {value: {validate: "string", minLength: 4}},
        "admin:number": {value: ["notMandatory", {validate: "number", min: 10}]}
      }
    }
  };

  t.deepEqual(v.validate({meta: {value: 'on', type: 'string', domain: 'admin'}}, rule), {
    meta: {value: ["must have at least 4 characters"]}
  });

  t.deepEqual(v.validate({meta: {value: 5, type: 'number', domain: 'admin'}}, rule), {
    meta: {value: ["must be at least 10"]}
  });

  t.deepEqual(v.validate({meta: {value: null, type: 'number', domain: 'admin'}}, rule), {});

  t.deepEqual(v.validate({meta: {value: 'on', type: 'string', domain: 'user'}}, rule), {});

  t.deepEqual(v.validate({meta: {value: 5, type: 'number', domain: 'user'}}, rule), {});

  t.deepEqual(v.validate({meta: {value: null, type: 'number', domain: 'user'}}, rule), {});

  t.end();
});

test('switch: func switch on nested validation', t => {
  let rule = {
    meta: {
      "switch": o => o.domain + ':' + o.type,
      "cases": {
        "admin:string": {value: {validate: "string", minLength: 4}},
        "admin:number": {value: ["notMandatory", {validate: "number", min: 10}]}
      }
    }
  };

  t.deepEqual(v.validate({meta: {value: 'on', type: 'string', domain: 'admin'}}, rule), {
    meta: {value: ["must have at least 4 characters"]}
  });

  t.deepEqual(v.validate({meta: {value: 5, type: 'number', domain: 'admin'}}, rule), {
    meta: {value: ["must be at least 10"]}
  });

  t.deepEqual(v.validate({meta: {value: null, type: 'number', domain: 'admin'}}, rule), {});

  t.deepEqual(v.validate({meta: {value: 'on', type: 'string', domain: 'user'}}, rule), {});

  t.deepEqual(v.validate({meta: {value: 5, type: 'number', domain: 'user'}}, rule), {});

  t.deepEqual(v.validate({meta: {value: null, type: 'number', domain: 'user'}}, rule), {});

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
    value: ["must have at least 4 characters"]
  });

  t.deepEqual(v.validate({value: 5, type: 'number', enforce: false}, rule), {});
  t.deepEqual(v.validate({value: 5, type: 'number', enforce: true}, rule), {
    value: ["must be at least 10"]
  });

  t.end();
});

test('switch: smart enough to separate validation rule from switch transformer', t => {
  t.deepEqual(v.validate({meta: {switch: ''}}, {meta: {switch: 'mandatory'}}), {meta: {switch: ["must not be empty"]}});
  t.deepEqual(v.validate({meta: {switch: '', cases: ''}}, {meta: {switch: 'mandatory', cases: 'mandatory'}}),
    {meta: {switch: ["must not be empty"], cases: ["must not be empty"]}});

  // not smart enough for this
  t.notDeepEqual(v.validate({meta: {switch: '', cases: ''}}, {meta: {switch: 'mandatory', cases: {validate: 'mandatory'}}}),
    {meta: {switch: ["must not be empty"], cases: ["must not be empty"]}});

  // need one hint
  t.deepEqual(v.validate({meta: {switch: '', cases: ''}}, {meta: {ignore: "notMandatory", switch: 'mandatory', cases: {validate: 'mandatory'}}}),
    {meta: {switch: ["must not be empty"], cases: ["must not be empty"]}});

  t.end();
});