
declare class Validation {
  addHelper(name: string, helper: any): void;
  addTransformer(tester: (rule: any) => boolean, transformer: (rule: any) => any): void;
  addValidator(name: string, imp: any): void;
  generateValidator(rulesMap: any, helper?: any): (model: any) => any;
  validate(model: any, rulesMap: any, helper?: any): any;
}

export default Validation;
