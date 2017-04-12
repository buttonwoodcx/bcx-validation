export default [
  //isTrue is the only validator implemented in func
  ["isTrue", v => v ? null : "must be true"],

  // all other validators are in form of rewrite or composition
  ["isFalse", {validate: "isTrue", value: "!$value", message: "must be false"}]
];
