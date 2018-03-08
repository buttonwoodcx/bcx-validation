<a name="0.2.15"></a>
## [0.2.15](https://github.com/buttonwoodcx/bcx-validation/compare/v0.2.14...v0.2.15) (2018-03-08)


### Bug Fixes

* fix BABEL_ENV to development to fix npm installation directly from git. ([5a89ed7](https://github.com/buttonwoodcx/bcx-validation/commit/5a89ed7))



<a name="0.2.14"></a>
## [0.2.14](https://github.com/buttonwoodcx/bcx-validation/compare/v0.2.13...v0.2.14) (2018-01-30)


### Features

* better support of Aurelia cli. ([9ab41d6](https://github.com/buttonwoodcx/bcx-validation/commit/9ab41d6))



## 0.2.13 - 11/Sep/2017

  * fix global name.

## 0.2.12 - 16/Aug/2017

  * add basic TypeScript support.

## 0.2.11 - 10/Aug/2017

  * improve performance by precompiling rules as much as possible.

## 0.2.10 - 02/Aug/2017

  * allow options to be used in value override on same validator.

## 0.2.9 - 08/Jun/2017

  * documentation.

## 0.2.8 - 06/Jun/2017

  * fixed a bug on option like {length: 2}, use `_.forOwn` not `_.each`.

## 0.2.7 - 02/Jun/2017

  * update bcx-expression-evaluator for bug fix.

## 0.2.6 - 02/Jun/2017

  * refactor validators implementation. improve performance, allow overwrite existing validator.

## 0.2.5 - 01/Jun/2017

  * remove try/catch for better performance.

## 0.2.4 - 22/May/2017

  * fix an issue on user defined transformer. Transformers should have higher precedence than all validators.

## 0.2.3 - 18/May/2017

  * fix an issue on nested validation when propertyName cannot be used in dot notation (obj.123 syntax error).

## 0.2.2 - 02/May/2017

  * fix switch transformer bug on complex expression.

## 0.2.1 - 30/Apr/2017

  * fix broken 0.2.0 as it was accidentally published through npm v3 (missing npm prepare).

## 0.2.0 - 30/Apr/2017

  * better support of nested validation.

## 0.1.7 - 21/Apr/2017

  * better error report.

## 0.1.6 - 21/Apr/2017

  * add feature for override message to wrap existing errors.

## 0.1.5 - 21/Apr/2017

  * add api addHelper to add default helper.

## 0.1.4 - 21/Apr/2017

  * better use of aurelia binding scope
  * support foreach on arry with simple value like ["a", "b"].

## 0.1.3 - 20/Apr/2017

  * fixed an issue on validating instance created by constructor.

## 0.1.2 - 20/Apr/2017

  * add generateValidator for building a function to validate model.

## 0.1.1 - 20/Apr/2017

  * fix typo.

## 0.1.0 - 20/Apr/2017

  * initial release.
