## [2.0.3](https://github.com/buttonwoodcx/bcx-validation/compare/v2.0.2...v2.0.3) (2021-07-09)


### Bug Fixes

* avoid wrong cache ([b388fe0](https://github.com/buttonwoodcx/bcx-validation/commit/b388fe048586cffac58147fdab007e0caf67edc4))



## [2.0.2](https://github.com/buttonwoodcx/bcx-validation/compare/v2.0.1...v2.0.2) (2021-07-09)



## [2.0.1](https://github.com/buttonwoodcx/bcx-validation/compare/v2.0.0...v2.0.1) (2021-07-06)



## [1.3.3](https://github.com/buttonwoodcx/bcx-validation/compare/v1.3.2...v1.3.3) (2020-09-15)


### Bug Fixes

* support object value in within, notIn and unique validators ([752c3f2](https://github.com/buttonwoodcx/bcx-validation/commit/752c3f261953cad046df295d75d382aacf9c2b88))



# [2.0.0](https://github.com/buttonwoodcx/bcx-validation/compare/v1.3.2...v2.0.0) (2021-07-06)


### Features

* use scope-eval and contextual-proxy to replace bcx-expression-evaluator ([5944614](https://github.com/buttonwoodcx/bcx-validation/commit/5944614352cd76bb79d78e36a85cc0bf278a4f87))


### BREAKING CHANGES

* the expression behaviour is now different from bcx-expression-evaluator,
notably not silent exception on accessing property of undefined.



## [1.3.3](https://github.com/buttonwoodcx/bcx-validation/compare/v1.3.2...v1.3.3) (2020-09-15)


### Bug Fixes

* support object value in within, notIn and unique validators ([752c3f2](https://github.com/buttonwoodcx/bcx-validation/commit/752c3f261953cad046df295d75d382aacf9c2b88))



## [1.3.2](https://github.com/buttonwoodcx/bcx-validation/compare/v1.3.1...v1.3.2) (2020-05-19)


### Bug Fixes

* babel after ncc to support es5 ([1098763](https://github.com/buttonwoodcx/bcx-validation/commit/1098763bc44a7907767e422f7ead12e3c44dd910))



## [1.3.1](https://github.com/buttonwoodcx/bcx-validation/compare/v1.3.0...v1.3.1) (2020-05-12)


### Bug Fixes

* leave out external deps ([d0ade98](https://github.com/buttonwoodcx/bcx-validation/commit/d0ade98cdb3ee532ec7bb77fc6c3f3c9bdfb2949))



# [1.3.0](https://github.com/buttonwoodcx/bcx-validation/compare/v1.2.0...v1.3.0) (2020-05-12)


### Features

* migrate from rollup to ncc ([91732e4](https://github.com/buttonwoodcx/bcx-validation/commit/91732e4707a3419f2dae4f4859432ef2c0572770))



# [1.2.0](https://github.com/buttonwoodcx/bcx-validation/compare/v1.1.2...v1.2.0) (2020-04-01)


### Features

* add global addTransformer and addValidator ([280a6a1](https://github.com/buttonwoodcx/bcx-validation/commit/280a6a1997c33fe86e652140f358d4ee59ccfd9e))



## [1.1.2](https://github.com/buttonwoodcx/bcx-validation/compare/v1.1.1...v1.1.2) (2020-03-16)


### Bug Fixes

* allow runtime validator option to access value of static option ([7a3dd8e](https://github.com/buttonwoodcx/bcx-validation/commit/7a3dd8e3c04565f37b0e17d09b8545856893dc33))



## [1.1.1](https://github.com/buttonwoodcx/bcx-validation/compare/v1.1.0...v1.1.1) (2019-11-04)


### Bug Fixes

* allow if transformer to access custom options ([75cda2b](https://github.com/buttonwoodcx/bcx-validation/commit/75cda2bf29f6bd303a226e0e3406a0d12beb82f6)), closes [#3](https://github.com/buttonwoodcx/bcx-validation/issues/3)



# [1.1.0](https://github.com/buttonwoodcx/bcx-validation/compare/v1.0.0...v1.1.0) (2019-10-11)


### Features

* support shared helpers with class method Validation.addHelper() ([0163f13](https://github.com/buttonwoodcx/bcx-validation/commit/0163f1351be7b79d0a284fe67957b424d66beeac))



<a name="1.0.0"></a>
# [1.0.0](https://github.com/buttonwoodcx/bcx-validation/compare/v0.4.0...v1.0.0) (2018-10-04)



<a name="0.4.0"></a>
# [0.4.0](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.7...v0.4.0) (2018-08-25)


### Features

* use babel loose mode for faster/smaller code ([dd3dac3](https://github.com/buttonwoodcx/bcx-validation/commit/dd3dac3))



<a name="0.3.7"></a>
## [0.3.7](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.6...v0.3.7) (2018-07-24)


### Features

* in email validator, block Intranet email address user@server1 as it's rarely used nowadays ([5104bce](https://github.com/buttonwoodcx/bcx-validation/commit/5104bce))



<a name="0.3.6"></a>
## [0.3.6](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.5...v0.3.6) (2018-07-04)


### Bug Fixes

* invalid url without domain ([5861aaf](https://github.com/buttonwoodcx/bcx-validation/commit/5861aaf))



<a name="0.3.5"></a>
## [0.3.5](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.4...v0.3.5) (2018-07-04)



<a name="0.3.4"></a>
## [0.3.4](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.3...v0.3.4) (2018-07-04)


### Features

* add URL validator ([2a8edcd](https://github.com/buttonwoodcx/bcx-validation/commit/2a8edcd))
* support case insensitive match for within/notIn validators ([44c157a](https://github.com/buttonwoodcx/bcx-validation/commit/44c157a))



<a name="0.3.3"></a>
## [0.3.3](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.2...v0.3.3) (2018-05-17)


### Features

* support default case for switch transformer ([fa7d579](https://github.com/buttonwoodcx/bcx-validation/commit/fa7d579))



<a name="0.3.2"></a>
## [0.3.2](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.1...v0.3.2) (2018-05-17)


### Bug Fixes

* use original $value in error message override ([a2ee09f](https://github.com/buttonwoodcx/bcx-validation/commit/a2ee09f))



<a name="0.3.1"></a>
## [0.3.1](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.0...v0.3.1) (2018-05-17)


### Features

* support using function to override error message ([b189c6d](https://github.com/buttonwoodcx/bcx-validation/commit/b189c6d))



<a name="0.3.0"></a>
# [0.3.0](https://github.com/buttonwoodcx/bcx-validation/compare/v0.3.0-0...v0.3.0) (2018-05-07)



<a name="0.3.0-0"></a>
# [0.3.0-0](https://github.com/buttonwoodcx/bcx-validation/compare/v0.2.15...v0.3.0-0) (2018-05-07)


### Features

* doc moved to new site ([aa5f110](https://github.com/buttonwoodcx/bcx-validation/commit/aa5f110))
* support "if" transformer with "mandatory"/"notMandatory" rules ([e055b56](https://github.com/buttonwoodcx/bcx-validation/commit/e055b56))
* support using any options and overridden value in message override ([4b11519](https://github.com/buttonwoodcx/bcx-validation/commit/4b11519))



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
