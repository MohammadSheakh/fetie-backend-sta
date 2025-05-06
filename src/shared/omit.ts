const omit = <T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
  let finalObj: Partial<T> = {};
  for (let key in obj) {
    if (obj && Object.hasOwnProperty.call(obj, key) && !keys.includes(key as K)) {
      finalObj[key] = obj[key];
    }
  }
  return finalObj as Omit<T, K>;
};

export default omit;

/**
 * 
 * TypeScript’s Pick and Omit:

  Only work at compile-time to enforce types.
  Don’t modify or create new objects.
  
  Your functions:

  Operate on real objects at runtime.
  Return a new object with desired keys included/excluded.
 */