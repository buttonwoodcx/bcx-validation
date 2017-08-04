# Tutorial

In this tutorial, we will show you how to compose a `rule`, from the most basic atomic rule to very complex rule. We will revisit the example we showed in [README](../README.md), to see what happened there.

```javascript
import Validation from 'bcx-validation';
const validation = new Validation();
```

## Basic shape of a rule

`bcx-validation` makes zero assumption about your `model` (the stuff you want to validate), it can be any Javascript object.

A `model` can be simply a String or Number (or even Function or null/undefined). We will start with simplest `model` to show you the simplest usage of `rule`.

Let's use term `validator` for an implementation of executing certain `rule`.

To use `isTrue` `validator`, you write a rule like this:

```javascript
{validate: "isTrue"}
```

Every `bcx-validation` rule is an object with reserved key `validate`, the value of the key is a string identifying an known `validator` to your validation instance.

> Note `isTrue` validator tests truthy of the value, empty string and number zero are false, but empty array/object are true.

When it fails, it returns an array of error message.

```javascript
validation.validate(false, {validate: "isTrue"})
// => ["must be true"]
```

>  For consistency, even a single error message is wrapped in an array.

When it passes, it returns undefined.

```javascript
validation.validate(true, {validate: "isTrue"})
// => undefined
```

### Optional value override and message override

Instead of testing the current value, you can override the value before it is being judged.

#### Override using expression

```javascript
validation.validate("lorem", {validate: "isTrue", value: "$value.length >= 8"});
// => ["must be true"]
```

The error message is odd, it doesn't reflect our intension, let's overwrite it.

```javascript
validation.validate("lorem", {validate: "isTrue",
                              value: "$value.length >= 8",
                              message: "must be at least 8 characters long"});
// => ["must be at least 8 characters long"]
```

This looks better.

> `value` and `message` are the other two reserved keys in `bcx-validation` rule, it provides override point for value and error message.

> They are the key features to allow us to do [validator composition](#define-new-validator-with-composition).

Look back on the value override, `"$value.length >= 8"`, this is processed by [bcx-expression-evaluator](https://github.com/buttonwoodcx/bcx-expression-evaluator), which uses exact same syntax as aurelia-binding provides. For users with some aurelia background, `$this` and `$parent` are special context variables you can use inside the expression. `bcx-validation` introduces more special context variables.

Here `$value` is the first speical context variable that `bcx-validation` makes available to expression. `$value` represents the value ("lorem") being validated.

> Since we have not use any [nested rule](#nested-rule) here, both `$value` and `$this` means "lorem", you can use `"$this.length >= 8"` for value override, the result will be same. In nested rule usage, `$value` means the value of current property, `$this` means current context (the model has that property). We will explain it later.

#### Override using function

In Buttonwoodcx, we mainly use expression. But for most of users, if you don't need expression, you can supply function for value override.

```javascript
validation.validate("lorem", {validate: "isTrue",
                              value: value => value.length >= 8,
                              message: "must be at least 8 characters long"});
// => ["must be at least 8 characters long"]
```

> You might noticed the function we used for value override is not quite safe, when value is null/undefined, the above code raises exception on `value.length`. The safer way is to do `value => value && value.length >= 8`.

> While you have to be careful to do not provide functions throws exception, `bcx-expression-evaluator` is quite safe, silent most of the time, `"$value.length >= 8"` never throws exception.

> The full list of arguments of that function is `function(value, propertyPath, context, get)`. We only used the first `value` argument here. `propertyPath` and `context` are useful in [nest rule](#nested-rule), `get` is a function to get arbitary expression value from current scope. In `bcx-validation`, no matter what you use function for, (to override value, to define raw validator, to provide a rule factory) they all have that same list of arguments, but there are different requiremnts on return value.

If you are interested on using expression, please read through [bcx-expression-evaluator README](https://github.com/buttonwoodcx/bcx-expression-evaluator).

`bcx-validation` uses [lodash](https://github.com/lodash/lodash) extensively. For convenience, lodash is available as a helper to any expression used in `bcx-validation`. So instead of `"$value.length >= 8"`, you can also write `"_.size($value) >= 8"`.

Let's look back on the message override again, the message you provided is actually evaluated by `bcx-expression-evaluator` in es6 string interpolation mode. `"must be at least 8 characters long"` is actually like es6 `` `must be at least 8 characters long` ``.

It means you can do this:

```javascript
validation.validate("lorem", {validate: "isTrue",
                              value: "$value.length >= 8",
                              message: '"${$value}" is less than 8 characters long'});
// => ['"lorem" is less than 8 characters long']
```

You have heard `bcx-validation` treats expression and function almost exchangeable. It means you can do this:

```javascript
validation.validate("lorem", {validate: "isTrue",
                              value: "$value.length >= 8",
                              message: value => `"${value}" is less than 8 characters long`});
// => ['"lorem" is less than 8 characters long']
```

#### Override using regex

Besides expression and function, you can also use regex in value override.

```javascript
validation.validate("abc", {validate: "isTrue",
                              value: /\d/,
                              message: "must contain some digits"});
// => ["must contain some digits"]
```

When you use regex, it behaves as value override with function `value => /\d/.test(value)`.

> The reason of supporting regex in value override, is `bcx-expression-evaluator`'s limitation. It doesn't allow regex literal inside expression.

> When use regex in value override, the returned value is either true or false. Use `isTrue` or `isFalse` validator with regex value override.

> `{validate: "isTrue", value: /regex/, message: "..."}` looks verbose, `bcx-validation` allows you to write `{validate: /regex/, message: "..."}` or simply `/regex/` (if you don't even want to override error message). The shortcuts are implemented in [transformer](#transformer-rule).

#### Use bare string as shortcut

When you don't need to override either value or error message. You can use the bare validator name as shortcut.

```javascript
validation.validate(false, "isTrue")
// => ["must be true"]
```

> In the example showed in [README](../README.md), `"email"`, `"mandatory"` etc do not have the full shape of a rule. They are shortcuts, the full form of `"email"` is still `{validate: "email"}`.

## Raw function as rule

Instead of using standard validators provided by `bcx-validation`, you can supply a raw function as validator.

```javascript
const validateLength = value => {
  if (!(value && value.length >= 8)) {
    return "must be at least 8 characters long"
  }
};
```

If value passed your validator, it should return nothing (null/undefined). Otherwise, return a string or array of strings as error message.

```javascript
validation.validate("abc", validateLength);
// => ["must be at least 8 characters long"]
```

> This is not the only way a raw validator can return. It could return a shaped result like `{isValid: false, message: "some error", break: true}` for fine control of chain of validators. We will talk about it more in [chain of rules](#chain-of-rules).

> A raw validator can also return a boolean. True means pass, false means fail with default error message "invalid". `validation.validate("abc", v => v && v.length >= 8);` => `["invalid"]`.

### Define new validator with function

Raw function validator is rarely used. It doesn't take any of `bcx-validation`'s advantages. For reusability, it's better to add a new validator.

```javascript
validation.addValidator("atLeast8Chars", value => {
  if (!(value && value.length >= 8)) {
    return "must be at least 8 characters long"
  }
});

validation.validate("abc", {validate: "atLeast8Chars"});
// or
validation.validate("abc", "atLeast8Chars");
// => ["must be at least 8 characters long"]
```

Now you can use value and error message override.

```javascript
validation.validate("name#id_123#mark", {validate: "atLeast8Chars",
                                         value: "_.split($value, '#')[1]",
                                         message: "id must be at least 8 characters long"});
// => ["id must be at least 8 characters long"]
```

You can wrap error message over existing error message.

```javascript
validation.validate("name#id_123#mark", {validate: "atLeast8Chars",
                                         value: "_.split($value, '#')[1]",
                                         message: "id ${_.join($errors, ', ')}"});
// => ["id must be at least 8 characters long"]
```

> `$errors` is a special context variable only within error message override, it represents the original error messages array.

> You might noticed the new validator we defined is quite bad for reusage. It could be better if the min length was passed in as option `{validate: "atLeast", length: 8}`. We will revisit this and show you how to support option in validator function after [validator composition](#define-new-validator-with-composition).

## Chain of rules

You can use multiple rules to validate a value. `bcx-validation` will merge all error messages into one single array.

```javascript
validation.validate("lorem", [
 {validate: /[a-z]/, message: "must contain lower case letter"},
 {validate: /[A-Z]/, message: "must contain upper case letter"},
 {validate: /\d/, message: "must contain digit"},
]);
// => ['must contain upper case letter', 'must contain digit']
```

When `bcx-validation` validates the value, you have chance to break the chain (stop it early) using reserved keys `stopValidationChainIfFail` and `stopValidationChainIfPass`. Here the 3rd rule is skipped because of failure on the 2nd rule.

```javascript
validation.validate("lorem", [
 {validate: /[a-z]/, message: "must contain lower case letter", stopValidationChainIfFail: true},
 {validate: /[A-Z]/, message: "must contain upper case letter", stopValidationChainIfFail: true},
 {validate: /\d/, message: "must contain digit"},
]);
// => ['must contain upper case letter']
```

`bcx-validation` also provides three validators to support easy early break of chain. `passImmediatelyIf`, `skipImmediatelyIf`, `failImmediatelyIf`.

```javascript
var rule = [
  {validate: "passImmediatelyIf", value: "$value == 'NA'"},
  {validate: "failImmediatelyIf", value: "_.isEmpty($value)", message: "must not be empty"},
  {validate: /[a-z]/, message: "must contain lower case letter", stopValidationChainIfFail: true},
  {validate: /[A-Z]/, message: "must contain upper case letter", stopValidationChainIfFail: true},
  {validate: /\d/, message: "must contain digit"},
];

validation.validate("NA", rule);
// => undefined

validation.validate("", rule);
// => ['must not be empty']
```

Here the first validation checks if value is `"NA"`, stop the validation chain immediately and return as passed. The second validation checks if value is empty, stop the validation chain immediately and fail with message "must not be empty".

> We kept rest of the rule unchanged, but you can rewrite the third rule as `{validate: "failImmediatelyIf", value => !/[a-z]/.test(v), message: "must contain lower case letter"}`.

> You can use `skipImmediatelyIf` in first validation. It behaves same as `passImmediatelyIf` in this use case. The difference between `skip` and `pass` is that `bcx-validation` actually has 3 states for result: `pass`, `fail` and `skip` (considered neither pass nor fail). The final result generated by `validation.validate(...)` only contains error literals, the tri-state was not exposed to end user. State `skip` was designed to properly implement conditional validation (the `if` transformer).

Since chain of rules is considered a rule, you can use sub-chain inside a chain. Beware early break of sub-chain doesn't affect the outer chain. Here the last rule was still checked after early break in previous sub-chain.

```javascript
var rule = [
  {validate: "passImmediatelyIf", value: "$value == 'NA'"},
  {validate: "failImmediatelyIf", value: "_.isEmpty($value)", message: "must not be empty"},
  [
    {validate: /[a-z]/, message: "must contain lower case letter", stopValidationChainIfFail: true},
    {validate: /[A-Z]/, message: "must contain upper case letter", stopValidationChainIfFail: true},
    {validate: /\d/, message: "must contain digit"}
  ],
  {validate: /_/, message: "must contain undercore"}
];

validation.validate("a", rule);
// => [ 'must contain upper case letter', 'must contain undercore' ]
```

With the introduction of chain control, it looks getting complicated. But fortunately, you will rarely use any of `passImmediatelyIf`, `skipImmediatelyIf`, `failImmediatelyIf`, `stopValidationChainIfFail` or `stopValidationChainIfPass`. They are meant to be used in defining new validator with composition.

#### Conditional validation (if transformer)
Before we get into composition, let's have a look of conditional validation.

```javascript
validation.validate("NA", {if: "$value != 'NA'", validate: /id\d+/, message: "invalid id format"});
// => undefined
validation.validate("xx", {if: "$value != 'NA'", validate: /id\d+/, message: "invalid id format"});
// => [ 'invalid id format' ]
validation.validate("id23", {if: "$value != 'NA'", validate: /id\d+/, message: "invalid id format"});
// => undefined
```

> We only support expression in `if` condition check, not function. This is to support an edge case that user really want to validate a property named "if" in the model. We will show example of this edge case in [nested rule](#nested-rule).

Conditional validation was implemented as `if` transformer. When `bcx-validation` sees that conditional rule, it transforms it into:

```javascript
validation.validate("NA", [
  {validate: "skipImmediatelyIf", value: "!($value != 'NA')"},
  {validate: /id\d+/, message: "invalid id format"}
]);
```

You can see we will rarely use `skipImmediatelyIf` directly, `if` transformer does the job, and makes the whole rule short and neat.

`if` transformer can wrap chain of rules too. Here is a rewrite of the previous chain rule.

```javascript
var rule = {
  if: "$value != 'NA'",
  group: [
    // 'mandatory' validator is almost same as {validate: "failImmediatelyIf", value: "_.isEmpty($value)", message: "must not be empty"},
    "mandatory",
    [
      {validate: /[a-z]/, message: "must contain lower case letter", stopValidationChainIfFail: true},
      {validate: /[A-Z]/, message: "must contain upper case letter", stopValidationChainIfFail: true},
      {validate: /\d/, message: "must contain digit"}
    ],
    {validate: /_/, message: "must contain undercore"}
  ]
};
```

### Define new validator with composition

In `bcx-validation`'s [standard validators](../src/standard-validators.js), only 5 validators are implemented with function. They are "isTrue", "isFalse", "skipImmediatelyIf", "passImmediatelyIf" and "failImmediatelyIf". All other validators are implemented with composition.

Composition is the best part of `bcx-validation`.

Even "isFalse" validator can be implemented with composition from "isTrue". Let's replace the standard "isFalse" validator.

```javascript
validation.validate(true, "isFalse"); // => [ 'must be false' ]
validation.addValidator(
  "isFalse",
  {validate: "isTrue", value: "!$value", message: "false is what I want"}
);
validation.validate(true, "isFalse"); // => [ 'false is what I want' ]
```

Value override and error message override still work.

```javascript
validation.validate("hello", {validate: "isFalse", value: "$value.length > 4", message: "cannot be longer than 4 chars"});
[ 'cannot be longer than 4 chars' ]
```

You see we reimplemented "isFalse" validator by reusing "isTrue" validator with value override `"!$value"` and error message override `"false is what I want"`.

> `bcx-validation` implemented the default "isFalse" validator with function instead of composition for slightly better performance. Because "isTrue" and "isFalse" are heavily used by other validators implemented with composition.

> with `validation.addValidator(name, composition_or_function)`, if you want, you can replace any of the standard validators.

Let's implement a new validator with composition of chain. Let's call it "myToken".

```javascript
validation.addValidator("myToken", [
  {validate: /[a-z]/, message: "must contain lower case letter", stopValidationChainIfFail: true},
  {validate: /[A-Z]/, message: "must contain upper case letter", stopValidationChainIfFail: true},
  {validate: /\d/, message: "must contain digit"}
]);
validation.validate("a", "myToken");
// => [ 'must contain upper case letter' ]
```

That is the basic form of valiator composition, but it would be nicer if it supports flexible options. What about using options to turn on every parts of "myToken" validator.
```javascript
validation.addValidator("myToken", [
  {if: "$lowerCase", validate: /[a-z]/, message: "must contain lower case letter", stopValidationChainIfFail: true},
  {if: "$upperCase",validate: /[A-Z]/, message: "must contain upper case letter", stopValidationChainIfFail: true},
  {if: "$digit", validate: /\d/, message: "must contain digit"}
]);
validation.validate("a", "myToken"); // nothing turned on, checks nothing.
// => undefined
validation.validate("a", {validate: "myToken", upperCase: true, digit: true}); // turned on upperCase and digit
// => [ 'must contain upper case letter' ]
validation.validate("a", {validate: "myToken", digit: true}); // turned on digit
// => [ 'must contain digit' ]
```

> Note when only "digit" option was turned on, the first two rules on lowerCase/upperCase were skipped, not considered failed, so `stopValidationChainIfFail` on them has no effect. Exactly what we want.

If `bcx-validation` sees a unknown key, it treats it as option. For `{validate: "myToken", upperCase: true, digit: true}`, it sees two options: "upperCase" and "digit", creates two special context variable `$upperCase` and `$digit` with their static value (both `true` in this case). That's how you can use them inside `if` condition.

> For `{validate: "myToken", upperCase: true, digit: true}`, option `$lowerCase` was not created by `bcx-validation`, it's an unused option, treated as undefined in expression. `if: "$lowerCase"` still works as expected.

> You can also use those special context variables in value override, message override.

> There is no pre definition required for any option to work.

Let's have a look of the source code for standard "number" validator.

```javascript
// copied from standard-validators.js
// {validate: 'number', integer: true, min: 0, max: 10, greaterThan: 0, lessThan: 10, even: true, /* odd: true */}
validation.addValidator("number", [
  {validate: "isTrue", value: v => _.isNumber(v), message: "must be a number", stopValidationChainIfFail: true},
  // option {integer: true}
  {if: "$integer", validate: "isTrue", value: v => _.isInteger(v), message: "must be an integer", stopValidationChainIfFail: true},
  // option {min: aNumber}
  {if: "_.isNumber($min)", validate: "isTrue", value: "$value >= $min", message: "must be at least ${$min}"},
  // option {greaterThan: aNumber}
  {if: "_.isNumber($greaterThan)", validate: "isTrue", value: "$value > $greaterThan", message: "must be greater than ${$greaterThan}"},
  // option {max: aNumber}
  {if: "_.isNumber($max)", validate: "isTrue", value: "$value <= $max", message: "must be no more than ${$max}"},
  // option {lessThan: aNumber}
  {if: "_.isNumber($lessThan)", validate: "isTrue", value: "$value < $lessThan", message: "must be less than ${$lessThan}"},
  // option {even: true}
  {if: "$even", validate: "isTrue", value: v => v % 2 === 0, message: "must be an even number"},
  // option {odd: true}
  {if: "$odd", validate: "isTrue", value: v => v % 2 === 1, message: "must be an odd number"}
]);
```

It supports 7 optional options, "integer", "min", "max", "greaterThan", "lessThan", "even" and "odd". User can use any combination or none. You might noticed we used some function (not expression) as value override in "number" validator, that's for slightly better performance. But when the value override needs to access option, we use expression, as using function to access option is bit too verbose.

Have a look of all the validators defined in [standard validators](../src/standard-validators.js), most of them should be pretty easy to understand now.

We have learnt how to use validator composition to easily use options. Let's revisit the validator "atLeast8Chars" that defined with function. I talked about it would be nicer to support a "length" option instead of fixed condition. Here is how you do it.

```javascript
validation.addValidator("atLeast", (value, propertyPath, context, get) => {
  const length = get("$length") || 8; // default to 8

  if (!(value && value.length >= length)) {
    return `must be at least ${length} characters long`
  }
});

validation.validate("abc", "atLeast");
// => ["must be at least 8 characters long"]
validation.validate("abc", {validate: "atLeast", length: 2});
// => undefined
validation.validate("a", {validate: "atLeast", length: 2});
// => ["must be at least 2 characters long"]
```

Just use the `get` function to retrieve any value out of current scope. Underneath, it evaluates an expression against the current scope.

> With `get("$value")`, `get("$propertyPath")` and `get("$this")`, you can get the same value for first 3 arguments (value, propertyPath and context).

In the example in [README](../README.md), there is an interesting usage of option "min" in "number" validator.

```javascript
{validate: "number", "min.bind": "ageLimit", message: "${$parent.name} must be at least ${ageLimit} years old"}]
```

If you use special option name "min.bind", instead of using string "ageLimit" as static value for option "min", `bcx-validation` will evaluate expression "ageLimit" against current scope, then use the value (21 as defined in parent context) as the option "min"'s value.

> Note that we didn't use parent context explicitly in the expression, "$parent.ageLimit" works same, but since it's not ambiguous, "ageLimit" works just fine. This is an aurelia-binding feature which `bcx-expression-evaluator` borrowed.

> Note in error message override, "$parent.name" is needed since "name" is ambiguous. "name" will be resulted to current customer name.

## Nested rule

```javascript
var rule = {
  name: ["mandatory", {validate: /^[A-Z]/, message: "must start with capitial letter"}],
  age: ["notMandatory", {validate: "number", min: 16}]
};

validation.validate({name: "", age: 18}, rule);
// => { name: [ 'must not be empty' ] }

validation.validate({name: "bob"}, rule);
// => { name: [ 'must start with capitial letter' ] }

validation.validate({name: "Bob", age: 12}, rule);
// => { age: [ 'must be at least 16' ] }

validation.validate({name: "bob", age: 12}, rule);
// => { name: [ 'must start with capitial letter' ], age: [ 'must be at least 16' ] }
```

As expected, the result is nested too.

Since a nested rule is considered a rule, you can put it in a chain.

```javascript
validation.validate({name: "bob", age: 12}, [rule]);
// => { name: [ 'must start with capitial letter' ], age: [ 'must be at least 16' ] }
```

You can chain two nested rule together, `bcx-validation` takes care of merging result.

```javascript
validation.validate({name: "", age: 12}, [
  {
    name: ["mandatory"]
  },
  {
    name: ["mandatory", {validate: /^[A-Z]/, message: "must start with capitial letter"}],
    age: ["notMandatory", {validate: "number", min: 16}]
  }
]);
// => { name: [ 'must not be empty' ], age: [ 'must be at least 16' ] }
```

> Note `bcx-validation` avoided the duplication of error message "must not be empty" on property "name".

> The chain of nested rule looks odd. But imaging in your app, you have validation rules contributed by two or more sub-systems, instead of merging validation rule together, you can just stack them as a chain, `bcx-validation` will make sure the result is perfectly merged without any duplication.

## Transformer rule

`bcx-validation` uses transformer to simplify the shape of the rule. You will rarely need to define a new transformer. But if you understand it, a new type of transformer can provide you maxium flexibility.

We have learnt `if` transformer in conditional validation. Let's define a new `ifNot` transformer by reusing `if` transformer.

```javascript
const ifNotTester = rule => (rule && _.isString(rule.ifNot) && !_.isEmpty(_.omit(rule, 'ifNot')));

validation.addTransformer(
  ifNotTester,
  rule => {
    const {ifNot, ...others} = rule;
    return {if: `!(${ifNot})`, ...others};
  }
);
```

The first argument for addTransformer is a tester function, it tests whether a rule can be processed by `ifNot` transformer. You would like to design the tester as defensive as possible to avoid false hit.

The sencond argument is the transformer function itself, with the rule as input, return a transformed rule object as output. Here we rewrite the rule with `if` transformer.

> When `bcx-validation` resolves a rule, it recursively expands into understandable validators. Here the output of `ifNot` transformer is another rule need to be transformed by `if` transformer. There is no limit of the depth of the resolution, as long as your transformers/validators design did not end up in infinite loop.

Here is another example of transformer. This is how we support bare regex as validation rule.

```javascript
validation.validate('ab', /[A-Z]/); // => ['invalid format']

// implemented by this transformer
// copied from standard-validators.js
// transform regex
validation.addTransformer(
  _.isRegExp,
  rule => ({validate: "isTrue", value: rule, message: 'invalid format'})
);
```

In summary, for flexibility, we use transformer to accept rule not matching the shape requirement (`{validate: "validatorName", ...}`). Have a look of all the transformers defined in [standard validators](../src/standard-validators.js), you should able to understand all of them except `switch` and `foreach` transformers.

> When `bcx-validation` resolves a rule, it tests against all transformers before trying any validator implementations. That's how `{if: 'condition', validate: 'isTrue'}` is processed by `if` transformer first. If `bcx-validation` tries validators before transformers, `{if: 'condition', validate: 'isTrue'}` will be wrongly treated as "isTrue" validator with option "if" with static value "condition".

> `switch` and `foreach` transformers are different, they are "readyToUse" transformer. As for now, we would not document how to implement a "readyToUse" transformer, it involves understanding how `bcx-validation` internally uses aurelia-binding scope. We will just document the usage of `switch` and `foreach` transformers, they are quite useful.

### switch transformer

```javascript
var rule = {
  value: {
    "switch": "type",
    "cases": {
      "string": ["mandatory", {validate: "string", minLength: 4}],
      "number": ["notMandatory", {validate: "number", min: 10}]
    }
  }
};

validation.validate({value: 'on', type: 'string'}, rule);
// => { value: [ 'must have at least 4 characters' ] }

validation.validate({value: 5, type: 'number'}, rule);
// => { value: [ 'must be at least 10' ] }
```

`switch` transformer can also be used in nested context, it's smart enough to figure out the context. Following rule can produce exact same error.

```javascript
var rule = {
  "switch": "type", // type is in nested context now
  "cases": {
    "string": {
      // nested rule
      value: ["mandatory", {validate: "string", minLength: 4}]
    },
    "number": {
      // nested rule
      value: ["notMandatory", {validate: "number", min: 10}]
    }
  }
};
```

The "switch" key accepts either expression or function. The result of the expression/function must be a string, which is used for "cases" lookup.

> Without `switch` transformer, you still can use multiple "if" conditional rules to do the same thing.

> The only reason for using "readyToUse" mode to implement `switch` transformer, is to smartly support both normal mode and nested mode. If cut off support of nested mode, `switch` transformer can be implemented in normal transfomer by simply reusing `if` transformer.

### foreach transformer

The example in [README](../README.md) is a good example of `foreach` transformer. It uses item index as the error key, that's default behaviour of `foreach` transformer.

#### Error key override

Let's use id as the error key, this makes it easier to inspect error object.

```javascript
var rule = {
  customers: {
    foreach: {
      name: ["mandatory", "unique"],
      age: ["notMandatory", {validate: 'number', min: 16}],
      id: ["mandatory", "unique"]
    },
    key: "id"
  }
};

var model = {
  customers: [
    {id: 'aa', name: 'Arm'},
    {id: 'ab', name: 'Bob'},
    {id: 'ab', name: 'Bob', age: 15},
    {id: 'ad', name: '', age: 18}
  ]
};

validation.validate(model, rule);
/* =>
{
  "customers": {
    "ab": {
      "name": ["must be unique"],
      "age": ["must be at least 16"],
      "id": ["must be unique"]
    },
    "ad": {
      "name": ["must not be empty"]
    }
  }
}
*/
```

> Note since the id "ab" is not unique, the error only appears once. If you don't use `key: "id"` error key override, the error will appears twice, one on "1", another on "2".

> key uses expression or function. Produced result must be a string.

#### Special context variables introduced by foreach

Undernearth, for every item in the model array, `foreach` transformer creates new override context (aurelia-binding concept) and add few special context variables.

> Similar to what aurelia repeator does in html template.

For example, when `foreach` is validating property "name" of the first item `{id: 'aa', name: 'Arm'}`, it has following context variables.

```
$value: "Arm"
$propertyPath: ["name"]
$this: {id: 'aa', name: 'Arm'}
$parent: {customers: [...all 4...]}

// introduced by foreach
$neighbours: [{id: 'ab', name: 'Bob'}, {id: 'ab', name: 'Bob', age: 15}, {id: 'ad', name: '', age: 18}]
$neighbourValues: ['Bob', 'Bob', '']
$index: 0
$first: true
$last: false
```

> $propertyPath is an array of property names, it can have multiple items (like `['address', 'line1']`) if it's a deep nested validation. Internally, we use it as lodash property path. You may wonder why we pick the complex array form `['address', 'line1']`, not the simple dot notation form `'address.line1'`. Loash supports both forms, but for some property name like "x.y", dot notation doesn't work (`a.x.y` does not mean `a["x.y"]`).

> $this is the new context created by foreach, which is the current item.

> $parent is the outer/parent context.

> $neighbours are all the siblings, BUT DO NOT INCLUDE $this itself.

> $neighbourValues are the relevant property values on $neighbours, they are same as `_.map($neighbours, _.property($propertyPath))` when $propertyPath is not empty. [When $propertyPath is empty](#use-foreach-to-validate-simple-array), $neighbourValues are same as $neighbours.

> $index, $first, $last are for the position of current item. They are similar to what aurelia repeator provides.

> For people with aurelia experience, note we don't have $even, $odd context variables in foreach. We don't provide them to avoid conflict with our standard "number" validator which supports $even/$odd options.

Let's have a look how we defined standard "unique" validator.

```javascript
// copied from standard-validators.js
// unique. need to access neighbours
// option items is evaluated from current scope
validation.addValidator("unique", {validate: "notIn", "items.bind": "$neighbourValues", message: "must be unique"});
```

"unique" validator reuses "notIn" validator, and use $neighbourValues in "notIn"'s "items" option.

> This is a good example of using "option.bind". In validator composition, use "bind" to pass runtime information to undernearth validators.

Let's do another exercise around foreach context variables. Let's validate, that in a group of people, there are only certain maxium number of leaders.

```javascript
validation.addValidator("maxLeader", {
  if: "$this.leader",
  validate: "number",
  value: "_($neighbours).filter({leader: true}).size()",
  "max.bind": "$max - 1",
  message: "Only maxium ${$max} leaders allowed"
});
```

We reuse "number" validator, when current person is a leader, checks the count of all neighbour leaders, the number can not exceed (max - 1).

> Note that we didn't check $max option, it assumes the option is mandatory. For safety, you can use `if: "$this.leader && $max > 0"`.

> Note we didn't use $value or $propertyPath in any of the expressions. This means our "maxLeader" validator can be applied to any property of a person. We will elaborate this in examples.

> We passed ($max - 1) to undernearth "number" validator's "max" option. This is not the only way to write "maxLeader", you can also do `{validate: "isTrue", value: "_...sizw() <= ($max - 1)"}`.

Let's try out our "maxLeader" validator.

```javascript
var validate2Leaders = validation.generateValidator({
  foreach: {
    name: ["mandatory", "unique"],
    leader: {validate: "maxLeader", max: 2}
  }
});

validate2Leaders([
  {name: 'A', leader: true},
  {name: 'B', leader: true},
  {name: 'C', leader: true},
  {name: 'D'},
]);
/* =>
{ '0': { leader: [ 'Only maxium 2 leaders allowed' ] },
  '1': { leader: [ 'Only maxium 2 leaders allowed' ] },
  '2': { leader: [ 'Only maxium 2 leaders allowed' ] } }
*/

validate2Leaders([
  {name: 'A', leader: true},
  {name: 'B', leader: true},
  {name: 'C'},
  {name: 'D'},
]);
// => undefined
```

Because the way we design "maxLeader", we can use it on other property instead of "leader" property.

```javascript
var validate2LeadersOnNameProperty = validation.generateValidator({
  foreach: {
    name: ["mandatory", "unique", {validate: "maxLeader", max: 2}],
  }
});

validate2LeadersOnNameProperty([
  {name: 'A', leader: true},
  {name: 'B', leader: true},
  {name: 'C', leader: true},
  {name: 'D'},
]);
/* =>
{ '0': { name: [ 'Only maxium 2 leaders allowed' ] },
  '1': { name: [ 'Only maxium 2 leaders allowed' ] },
  '2': { name: [ 'Only maxium 2 leaders allowed' ] } }
*/
```

Let's show you another version of "maxLeader". This time, assume it's validating "leader" property.

```javascript
validation.addValidator("maxLeader", {
  if: "$value", // current item.leader value
  validate: "number",
  value: "_($neighbourValues).compact().size()", // _.compact removes false leader
  "max.bind": "$max - 1",
  message: "Cannot exceed maxium ${$max} leaders"
});

validate2Leaders([
  {name: 'A', leader: true},
  {name: 'B', leader: true},
  {name: 'C', leader: true},
  {name: 'D'},
]);
/* => validating on "leader" still works
{ '0': { leader: [ 'Cannot exceed maxium 2 leaders' ] },
  '1': { leader: [ 'Cannot exceed maxium 2 leaders' ] },
  '2': { leader: [ 'Cannot exceed maxium 2 leaders' ] } }
*/

validate2LeadersOnNameProperty([
  {name: 'A', leader: true},
  {name: 'B', leader: true},
  {name: 'C', leader: true},
  {name: 'D'},
]);
/* => validating on "name", oops, all names are truthy
{ '0': { name: [ 'Cannot exceed maxium 2 leaders' ] },
  '1': { name: [ 'Cannot exceed maxium 2 leaders' ] },
  '2': { name: [ 'Cannot exceed maxium 2 leaders' ] },
  '3': { name: [ 'Cannot exceed maxium 2 leaders' ] } }
*/
```

An example to show `foreach` and `switch` work nicely together.

```javascript
var rule = {
  users: {
    foreach: {
      switch: 'type',
      cases: {
        customer: {
          email: ["notMandatory", "email"],
          phone: ["notMandatory", "unique"],
          name: ["mandatory", "unique"]
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

var model = {
  users: [
    {id: 'c01', type: 'customer', name: 'Arm', email: 'arm@test.com'},
    {id: 'c02', type: 'customer', name: 'Bob', email: 'bob@test.com'},
    {id: 'c03', type: 'customer', name: 'Bob', email: 'bob'},
    {id: 'd01', type: 'dealer', name: 'Dealer A', email: 'arm@test.com'},
    {id: 'd02', dealerId: 'dealer.b', type: 'dealer', name: 'Dealer B', email: 'on', phone: '02123'},
    {id: 'd03', dealerId: 'dealer.b', type: 'dealer', name: 'Dealer B', email: 'b@test.com', phone: '02123'},
  ]
};

validation.validate(model, rule);
/* =>
{ "users": {
    "c02": { "name": ["must be unique"] },
    "c03": { "email": ["not a valid email"],
             "name": ["must be unique"] },
    "d01": { "dealerId": ["must not be empty"],
             "phone": ["must not be empty"] },
    "d02": { "dealerId": ["must be unique"],
             "phone": ["must be unique"],
             "email": ["not a valid email"],
             "name": ["must be unique"] },
    "d03": { "dealerId": ["must be unique"],
             "phone": ["must be unique"],
             "name": ["must be unique"] } } }
*/
```

Chain rule works under `foreach` too. Following rule works same as previous one.

```javascript
var rule = {
  users: {
    foreach: [
      // generic rule on every customer/dealer
      {
        name: ["mandatory", "unique"],
        email: ["notMandatory", "email"],
        phone: ["notMandatory", "unique"]
      },
      // strict rule on dealder
      {
        switch: 'type',
        cases: {
          dealer: {
            dealerId: ["mandatory", "unique"],
            phone: ["mandatory", "unique"],
            email: ["mandatory", "email"],
          }
        }
      }
    ],
    key: "id"
  }
};
```

> Note we use rule for "customer" as the first one in chain. Second one only validating "dealer". Since all rules in "dealer" are stricter, the final result generated by `bcx-validation` will be nicely merged.

> The order of the rules doesn't matter here. If you swap the position of generic rule and strict rule, the final result is still same.

#### Use foreach to validate simple array

You can use `foreach` to validate simple array (not array of complex object).

```javascript
validation.validate(["xx", "ab@test.com", "-xi@ a"], {foreach: "email"});
// => { '0': [ 'not a valid email' ], '2': [ 'not a valid email' ] }
```
#### Use foreach to validate object

`foreach` is designed to validate array, but you still can use it to validate a normal object. Obviously $index, $first, $last do not make sense in this use case.

```javascript
validation.validate({meta: {field1: "  ", field2: "hello"}},
                    {meta: {foreach: "mandatory"}});
// => { meta: { field1: [ 'must not be empty' ] } }
```

#### `foreach` with rule factory function

The last feature of `foreach` is that it treats raw function specially.

We learnt before that a raw function is treated as raw validator implemention. But if it's used under `foreach`, it is treated as rule factory.

> This only applies to top level raw function, either in `{foreach: aRuleFactoryFunc}` or `{foreach: [normalRule, aRuleFactoryFunc, anotherRuleFactoryFunc,...]}`.

> This is designed to provide flexibility in `foreach` when `switch` and `if` is not enough for conditional validation.

The above `foreach` + `switch` example can be rewritten as:
```javascript
var rule = {
  users: {
    foreach: (user) => {
      switch(user.type) {
        case 'customer':
          return {
            email: ["notMandatory", "email"],
            phone: ["notMandatory", "unique"],
            name: ["mandatory", "unique"]
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
    key: "id"
  }
};
```

## Add helper for expression

`bcx-validation` by default adds lodash as a helper to `bcx-expression-evaluator`, so you can use lodash in all expressions.

You can add your own helper.

```javascript
validation.addHelper('sum', (a, b) => a + b);

var rule = {
  a: {
    validate: 'isTrue',
    value: 'sum($value, b) > 10',
    message: "sum(${sum($value,b)}) is not more than 10"
  }
};

validation.validate({a: 2, b: 3}, rule);
// => { a: ["sum(5) is not more than 10"] }
```

That was a trivial example. Here is a more useful example.

```javascript
var model = {
  customers: [
    {id: 'c1', name: 'A', friendIds: ['c3', 'c4']},
    {id: 'c2', name: 'B', friendIds: []},
    {id: 'c3', name: 'C', friendIds: ['c1']},
    {id: 'c4', name: 'D', friendIds: ['c1']},
  ]
};

validation.addHelper('customerOf', (id) => _.find(model.customers, {id}));
```

Then you can use `customerOf(a_id)` in any expression. For instance, on any property of a customer, you can do `"_(friendIds).map(customerOf).map('name').value()"` to get all friends' names for that customer.

## Summary

Since atomic rule, chain rule, nested rule, and transformers are treated generically as rule, they can be composed together in all sorts of ways.

Most time, `bcx-validation` treats expression and function exchangeable. There are two special cases:

> In `if` transformer, `{if: "conditionExpression"}` only supports expression as condition. This is to avoid ambiguousness. If you want to validate a nested property named "if", you can use `{if: aFunction}` or `{if: {validate: "fullShapeRule"}}` or `{if: ["aliasInChain", ...]}`.

> In `foreach` transformer, top level function is a rule factory, not raw validator.

`bcx-validation`'s rule format is simple and readable, it always tries to understand what you want.

But when validating some property name that's one of `bcx-validation`'s reserved keys, it could be ambiguous. Like validating property named "validate" with "mandatory" validator: `{validate: "mandatory"}` (`bcx-validation` would not see it as your intended nested validation).

> Reserved keys are `validate`, `value`, `message`, `stopValidationChainIfFail`, `stopValidationChainIfPass`. Plus `if`, `switch`, `foreach`, `key`, introduced by standard transformers.

The easy way to avoid ambiguousness is to use either full shape, or wrap it in a chain, `{validate: {validate: "mandatory"}}` or `{validate: ["mandatory"]}`. This works for all our reserved keys.

> Note `foreach` and `key` works in a pair. Either they are recognised as `foreach` transformer as a whole, or recognised as nested validation on property "foreach" and "key".

Happy validating!

[BUTTONWOODCX™ PTY LTD](http://www.buttonwood.com.au).

