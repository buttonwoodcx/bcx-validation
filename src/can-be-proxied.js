
export default function canBeProxied(value) {
  const type = typeof value;
  return type === 'function' || (type === 'object' && value !== null);
}
