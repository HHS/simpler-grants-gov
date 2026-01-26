// Merge a base and derived config
export function deepMerge(obj1, obj2) {
  const result = { ...obj1 };

  for (let key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (obj2[key] instanceof Object && obj1[key] instanceof Object) {
        result[key] = deepMerge(obj1[key], obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    }
  }

  return result;
}
