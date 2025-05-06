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