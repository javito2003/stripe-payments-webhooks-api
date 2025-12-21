const arrayToMap = <T, K extends keyof T>(array: T[], key: K): Map<T[K], T> => {
  const map = new Map<T[K], T>();
  array.forEach((item) => {
    map.set(item[key], item);
  });
  return map;
};

const arrayUtils = {
  arrayToMap,
};

export default arrayUtils;
