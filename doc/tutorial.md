# Tutorial

In this tutorial, we will show you how to compose a `rule`, from the most basic atomic rule to very complex rule. We will revisit the example we showed in [README](../README.md), to see what happened there.

    import Validation from 'bcx-validation';
    const validation = new Validation();

## Basic shape of a rule

`bcx-validation` makes zero assumption about your `model` (the stuff you want to validate), it can be any Javascript object.

A `model` can be simply a String or Number (or even Function or null/undefined). We will start with simplest `model` to show you the simplest usage of `rule`.

Let's use term `validator` for an implementation of excuting certain `rule`.

To use `isTrue` `validator`, you write a rule like this:

    {validate: "isTrue"}

Every `bcx-validation` rule is an object with reserved key `validate`, the value of the key is a string identifying an known `validator` to your validation instance.

> Note `isTrue` validator tests truthy of the value, empty string and number zero are false, but empty array/object are true.

> You can extend `bcx-validation` by adding new validator.

> In the example showed in [README](../README.md), `"email"`, `"mandatory"` etc do not have the full shape of a rule. They are shortcuts, implemented in [transformer](#transformer-rule), the full form of `"email"` is still `{validate: "email"}`.

When it fails, it returns an array of error message.

    validation.validate(false, {validate: "isTrue"})
    // => ["must be true"]

>  For consistency, even a single error message is wrapped in an array.

When it passes, it returns undefined.

    validation.validate(true, {validate: "isTrue"})
    // => undefined

### Optional value override and message override

Instead of testing the current value, you can override the value before it is being judged.

#### Override using expression

    validation.validate("lorem", {validate: "isTrue", value: "$value.length >= 8"});
    // => ["must be true"]

The error message is odd, it doesn't reflect our intension, let's overwrite it.

    validation.validate("lorem", {validate: "isTrue",
                                  value: "$value.length >= 8",
                                  message: "must be at least 8 characters long"});
    // => ["must be at least 8 characters long"]

This looks better.

> `value` and `message` are the other two reserved keys in `bcx-validation` rule, it provides override point for value and error message.

> They are the key features to allow us to do [validator composition](#define-new-validator-with-composition).

Look back on the value override, `"$value.length >= 8"`, this is processed by [bcx-expression-evaluator](https://github.com/buttonwoodcx/bcx-expression-evaluator), which uses exact same syntax as aurelia-binding provides. For users with some aurelia background, `$this` and `$parent` are special context variables you can use inside the expression. `bcx-validation` introduces more special context variables.

Here `$value` is the first speical context variable that `bcx-validation` makes available to expression. `$value` represents the value ("lorem") being validated.

> Since we have not use any [nested rule](#nested-rule) here, both `$value` and `$this` means "lorem", you can use `"$this.length >= 8"` for value override, the result will be same. In nested rule usage, `$value` means the value of current property, `$this` means current context (the model has that property). We will explain it later.

#### Override using function

In Buttonwoodcx, we mainly use expression. But for most of users, if you don't need expression, you can supply function for value override.

    validation.validate("lorem", {validate: "isTrue",
                                  value: value => value.length >= 8,
                                  message: "must be at least 8 characters long"});
    // => ["must be at least 8 characters long"]

> You might noticed the function we used for value override is not quite safe, when value is null/undefined, the above code raises exception on `value.length`. The safer way is to do `value => value && value.length >= 8`.

> While you have to be careful to do not provide functions throws exception, `bcx-expression-evaluator` is quite safe, silent most of the time, `"$value.length >= 8"` never throws exception.

> The full list of arguments of that function is `function(value, propertyPath, context, get)`. We only used the first `value` argument here. `propertyPath` and `context` are useful in [nest rule](#neste-rule), `get` is a function to get arbitary expression value from current scope.

> In `bcx-validation`, no matter what you use function for, (to override value, to define raw validator, to provide a rule factory) they all have that same list of arguments, but there are different requiremnts on return value.

If you are interested on using expression, please read through [bcx-expression-evaluator README](https://github.com/buttonwoodcx/bcx-expression-evaluator).

`bcx-validation` uses [lodash](https://github.com/lodash/lodash) extensively. For convenience, lodash is available as a helper to any expression used in `bcx-validation`. So instead of `"$value.length >= 8"`, you can also write `"_.size($value) >= 8"`.

Let's look back on the message override again, the message you provided is actually evaluated by `bcx-expression-evaluator` in es6 string interpolation mode. `"must be at least 8 characters long"` is actually like es6 `` `must be at least 8 characters long` ``.

It means you can do this:

    validation.validate("lorem", {validate: "isTrue",
                                  value: "$value.length >= 8",
                                  message: "\"${$value}\" is less than 8 characters long"});
    // => ['"lorem" is less than 8 characters long']

You have heard `bcx-validation` treats expression and function almost exchangeable. It means you can do this:

    validation.validate("lorem", {validate: "isTrue",
                                  value: "$value.length >= 8",
                                  message: value => `"${value}" is less than 8 characters long`});
    // => ['"lorem" is less than 8 characters long']

#### Override using regex

Besides expression and function, you can also use regex in value override.

    validation.validate("abc", {validate: "isTrue",
                                  value: /\d/,
                                  message: "must contain some digits"});
    // => ["must contain some digits"]

When you use regex, it behaves as `value => /\d/.test(value)`.

> The reason of supporting regex in value override, is `bcx-expression-evaluator`'s limitation. It doesn't allow regex literal inside expression.

> When use regex in value override, the returned value is either true or false. It means most likely to use `isTrue` or `isFalse` validator with regex value override.

> `{validate: "isTrue", value: /regex/, message: "..."}` looks verbose, `bcx-validation` allows you to write `{validate: /regex/, message: "..."}` or simply `/regex/` (if you don't even want to override error message). The shortcuts are implemented in [transformer](#transformer-rule).

## Raw function as rule

Instead of using standard validators provided by `bcx-validation`, you can supply a raw function as validator.

    const validateLength = value => {
      if (!(value && value.length >= 8)) {
        return "must be at least 8 characters long"
      }
    };

If value passed your validator, it should return nothing (null/undefined). Otherwise, return a string or array of strings as error message.

    validation.validate("abc", validateLength);
    // => ["must be at least 8 characters long"]

> This is not the only way a raw validator can return. It could return a shaped result like `{isValid: false, message: "some error", break: true}` for fine control of chain of validators. We will talk about it more in [chain of rules](#chain-of-rules).

> A raw validator can also return a boolean. True means pass, false means fail with default error message "invalid". `validation.validate("abc", v => v && v.length >= 8);` => `["invalid"]`.

### Define new validator with function

Raw function validator is rarely used. It doesn't take any of `bcx-validation`'s advantages. For reusability (and value/message override we saw before), it's better to add a new validator.

    validation.addValidator("atLeast8Chars", value => {
      if (!(value && value.length >= 8)) {
        return "must be at least 8 characters long"
      }
    });

    validation.validate("abc", {validate: "atLeast8Chars"});
    // => ["must be at least 8 characters long"]

Now you can use value and error message override.

    validation.validate("name#id_123#mark", {validate: "atLeast8Chars",
                                             value: "_.split($value, '#')[1]",
                                             message: "id must be at least 8 characters long"});
    // => ["id must be at least 8 characters long"]

You can wrap error message over existing error message.

    validation.validate("name#id_123#mark", {validate: "atLeast8Chars",
                                             value: "_.split($value, '#')[1]",
                                             message: "id ${_.join($errors, ', ')}"});
    // => ["id must be at least 8 characters long"]

> `$errors` is a special context variable only within error message override, it represent original array of errors.

> You might noticed the new validator we defined is quite bad for reusage. It could be better if the min length was passed in as option `{validate: "atLeast", length: 8}`. We will revisit this and show you how to support option in validator function after [validator composition](#define-new-validator-with-composition).

## Chain of rules

### Define new validator with composition

## Nested rule

## Transformer rule

### Define alias
(many aliases are implemented in transformer)

### if transformer

### switch transformer

### foreach transformer

(since atomic rule, array, nested, and transformers are treated as rule, they can be composed in all sorts of ways.)
## Revisit the example in README