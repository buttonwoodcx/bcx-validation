# bcx-validation [![Build Status](https://travis-ci.org/buttonwoodcx/bcx-validation.svg?branch=master)](https://travis-ci.org/buttonwoodcx/bcx-validation)

Another validation library to meet our own need.

Why not just use some existing validation tool?

1. most validation tool thinks model is just key-val pairs. We want to validate complex object (a blueprint for cloud deployment). For instance, if cloud provider is AZURE, validates that all vms connected to a load balancer must be within same availablity set, no validation tool on the market is flexible enough to do this.

2. we need to be able to describe validation rule in JSON, as all our business logic is delivered from backend to front-end. (function can still be used in many parts of the rule. Although Buttonwoodcx mainly uses `bcx-validation`'s expression support, `bcx-validation` itself treats function and expression almost exchangeable.)

3. we just want a light validation tool, a function that takes `model` and `rule` as input, produces a structured `error` object as output. We don't need a validation tool that bundled with view/controller layer. Binding model to view layer is not even hard in [aurelia](http://aurelia.io), we don't need the help.

Read documentation here https://buttonwoodcx.github.io/doc-bcx-validation

[BUTTONWOODCX™ PTY LTD](http://www.buttonwood.com.au).
