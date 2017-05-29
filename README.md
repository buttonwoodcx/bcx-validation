# bcx-validation [![Build Status](https://travis-ci.org/buttonwoodcx/bcx-validation.svg?branch=master)](https://travis-ci.org/buttonwoodcx/bcx-validation)

Another validation library to meet our own need.

Why not just use some existing validation tool?

1. most validation tool thinks model is just key-val pairs. We want to validate complex object (a blueprint for cloud deployment). For instance, if cloud provider is AZURE, validates that all vms connected to a load balancer must be within same availablity set, no validation tool on the market is flexible enough to do this.

2. we need to be able to describe validation rule in JSON, as all our business logic is delivered from backend to front-end. (function can still be used in many parts of the rule. Although Buttonwoodcx mainly uses `bcx-validation`'s expression support, `bcx-validation` itself treats function and expression almost exchangable.)

3. we just want a light validation tool, a function that takes `model` and `rule` as input, produces a structured `error` object as output. We don't need a validation tool that bundled with view/controller layer. Binding model to view layer is not even hard in [aurelia](http://aurelia.io), we don't need the help.

## A quick example

The entry is designed as a class instead of a function, in order to allow user to add more validator implementations and helpers to the tool before validating the model.

    import Validation from 'bcx-validation';
    const validation = new Validation();

The rule.

    const rule = {
      name: "mandatory",
      customers: {
        foreach: {
          email: "email",
          name: ["mandatory", "unique"],
          age: ["notMandatory", {validate: "number",
                                 "min.bind": "ageLimit",
                                 message: "${$parent.name} must be at least ${ageLimit} years old"}]
        }
      }
    };

Notice we use [bcx-expression-evaluator](https://github.com/buttonwoodcx/bcx-expression-evaluator) in `number` validator's `min` option and error `message` override.

The model object.

    const model = {
      name: 'driver group',
      ageLimit: 21,
      customers: [
        {name: 'Arm', email: 'arm@test.com'},
        {name: 'Bob', email: 'bob@test.com'},
        {name: 'Bob', email: 'bob', age: 15},
        {name: '', age: 18}
      ]
    };

Validate it.

    validation.validate(model, rule);

Or generate a function that can be used repeatedly. Following two line do the same thing.

    const validate = validation.generateValidator(rule);
    validate(model);

Returned error object.

    {
      customers: {
        "1": {name: ["must be unique"]},
        "2": {name: ["must be unique"], email:["not a valid email"], age: ["driver group must be at least 21 years old"]},
        "3": {name: ["must not be empty"], email:["not a valid email"], age: ["driver group must be at least 21 years old"]}
      }
    }

Notice `customers` in the error object is not an array, it looks like a sparse array but has no `length` property. Here the `key` of every error is the original index of the item, you can use other thing (like customer id) for the `key` in [`foreach`](doc/tutorial.md#foreach-transformer) validator.

If this looks useful to you, jump to the full [tutorial](doc/tutorial.md).