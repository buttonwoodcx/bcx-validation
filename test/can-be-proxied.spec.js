import test from 'tape';
import canBeProxied from '../src/can-be-proxied';

test('object can be proxied, but not null object', t => {
  console.log('canBeProxied({})', canBeProxied({}));
  t.ok(canBeProxied({}));
  t.ok(canBeProxied(Object.create(null)));
  t.ok(canBeProxied([]));
  t.ok(canBeProxied({a: 1}));
  t.ok(canBeProxied(/a/));
  t.notOk(canBeProxied(null));
  t.end();
});

test('function can be proxied', t => {
  t.ok(canBeProxied(function() {}));
  t.ok(canBeProxied(() => false));
  t.end();
});

test('primitive values cannot be proxied', t => {
  t.notOk(canBeProxied(1));
  t.notOk(canBeProxied(0));
  t.notOk(canBeProxied(""));
  t.notOk(canBeProxied("lorem"));
  t.notOk(canBeProxied(NaN));
  t.notOk(canBeProxied(Infinity));
  t.notOk(canBeProxied(undefined));
  t.notOk(canBeProxied(false));
  t.notOk(canBeProxied(true));
  t.notOk(canBeProxied(Symbol('f')));
  t.end();
});
