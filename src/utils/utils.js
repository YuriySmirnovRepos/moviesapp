export default class Utils {
  static debounce = (fn, delay) => {
    let timeout = null;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  };

  static mergeDeep(obj1, obj2) {
    const checkObjects = (o1, o2) => {
      return (
        typeof o1 === "object" &&
        typeof o2 === "object" &&
        !!o1 &&
        !!o2 &&
        Object.getPrototypeOf(o1) === Object.prototype &&
        Object.getPrototypeOf(o2) === Object.prototype
      );
    };

    const result = {};
    for (const key in obj1) {
      if (Object.prototype.hasOwnProperty.call(obj1, key)) {
        if (Object.prototype.hasOwnProperty.call(obj2, key)) {
          result[key] = checkObjects(obj1[key], obj2[key])
            ? Utils.mergeDeep(obj1[key], obj2[key])
            : obj2[key];
        } else {
          result[key] = obj1[key];
        }
      }
    }
    return result;
  }

  static paginationData2DisplayConvert(
    pagDispNum,
    items2DisplayCount = 6,
    itemsPerPageDataCount = 20
  ) {
    const dataPageNum =
      Math.floor(
        ((pagDispNum - 1) * items2DisplayCount) / itemsPerPageDataCount
      ) + 1;
    const startIdx =
      ((pagDispNum - 1) * items2DisplayCount) % itemsPerPageDataCount;
    return { dataPageNum, startIdx };
  }
}
