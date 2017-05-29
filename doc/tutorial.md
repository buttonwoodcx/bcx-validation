# Tutorial

In this tutorial, we will show you how to compose a `rule`, from the most basic atomic rule to very complex rule. After that we will revisit the example we showed in [README](../README.md), to see what happened there.

    import Validation from 'bcx-validation';
    const validation = new Validation();

## Basic shape of a rule

`bcx-validation` makes zero assumption about your `model` (the stuff you want to validate), it can be any Javascript object.

A `model` can be simply a String or Number (or even Function or null/undefined). We will start with most simple `model` to show you the most simple usage of `rule`.

Let's use name `validator` for an implementation of excuting certain `rule`.

To use `isTrue` `validator`, you write a rule like this:

    {validate: "isTrue"}

Every `bcx-validation` rule is an object with reserved key `validate`, the value of the key is a string identifying an known `validator` to your validation instance.

> Note `isTrue` validator tests truthy of the value, empty string and number zero are false, but empty array/object are true.

> You can extend `bcx-validation` by [adding new validator](#define-new-validator).

> You might remember in the example showed in [README](../README.md), `"email"`, `"mandatory"` etc do not have the full shape of a rule. They are short-cut, implemented in [transformer](#transformer-rule-is-a-rule), the full form of `"email"` is still `{validate: "email"}`.

When the model fails, it returns an array of error message (or consistency, even a single error message is wrapped in an array)

    validation.validate(false, {validate: "isTrue"})
    // => ["must be true"]

When it passes, it returns undefined

    validation.validate(true, {validate: "isTrue"})
    // => undefined

### Optional value override, (expression (with lodash in helper), funciton, regex)

### Optional error message override

## Use a raw function as rule (explain shapes of return value)

## An array of rules is a rule

### Define new validator (a rule implementation) (use function or composition)

## Nested rules is a rule

## Transformer rule is a rule

### Define alias
(many aliases are implemented in transformer)

### if transformer

### switch transformer

### foreach transformer


## Revisit the example in README