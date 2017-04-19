import test from 'tape';
import Validation from '../../src/validation';
import _ from 'lodash';

const v = new Validation();

test('foreach: validates array', t => {
  let rule = {
    customers: {
      $foreach: {
        email: "email",
        name: ["mandatory", "unique"],
        age: ["notMandatory", {validate: 'number', min: 16}]
      }
    }
  };

  t.end();
});
