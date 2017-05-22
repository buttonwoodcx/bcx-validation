# Changelog

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
