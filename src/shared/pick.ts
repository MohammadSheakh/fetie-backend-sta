const pick = <T extends object, K extends keyof T>(obj: T, keys: K[]) => {
  let finalObj: Partial<T> = {};
  for (let key of keys) {
    if (obj && Object.hasOwnProperty.call(obj, key)) {
      finalObj[key] = obj[key];
    }
  }
  return finalObj;
};

export default pick;

/**
 * 
 * TypeScript’s Pick and Omit:

  Only work at compile-time to enforce types.
  Don’t modify or create new objects.
  
  Your functions:

  Operate on real objects at runtime.
  Return a new object with desired keys included/excluded.
 */

