import _ from 'lodash';
import proxy from 'contextual-proxy';

export default function (scope, variation) {
  if (_.isEmpty(variation)) return scope;
  let {$this, $parent, $contextual} = scope;
  const contextual = Object.create($contextual);
  Object.assign(contextual, variation);
  return proxy($this, $parent, contextual);
}
