export function shallowEquals(target1, target2) {
  // 원시값 비교
  if (target1 === target2) {
    return true;
  }

  // 원시값이 아닌데 객체도 아니라면 false
  if (!(typeof target1 === 'object' || typeof target2 === 'object')){
    return false;
  }

  const conditions = [
    target1.constructor.toString().startsWith('class') || target2.constructor.toString().startsWith('class'),
    target1 instanceof Number || target2 instanceof Number,
    target1 instanceof String || target2 instanceof String,
    target1 instanceof Boolean || target2 instanceof Boolean,
    target1 instanceof Symbol || target2 instanceof Symbol,
  ];

  if (conditions.some(condition => condition)) {
    return false;
  }

  // 배열 비교
  if (Array.isArray(target1) && Array.isArray(target2)) {
    return target1.length === target2.length && target1.every((value, index) => value === target2[index]);
  }

  // 객체 비교
  const target1Keys = Object.keys(target1);
  const target2Keys = Object.keys(target2);

  if (target1Keys.length !== target2Keys.length) {
    return false;
  }

  return target1Keys.every(key => target1[key] === target2[key]);
}

export function deepEquals(target1, target2) {
  // 원시값 비교
  if (target1 === target2) {
    return true;
  } 
  
  // 원시값이 아닌데 객체도 아니라면 false
  if (!(typeof target1 === 'object' || typeof target2 === 'object')){
    return false;
  }

  const conditions = [
    target1.constructor.toString().startsWith('class') || target2.constructor.toString().startsWith('class'),
    target1 instanceof Number || target2 instanceof Number,
    target1 instanceof String || target2 instanceof String,
    target1 instanceof Boolean || target2 instanceof Boolean,
    target1 instanceof Symbol || target2 instanceof Symbol,
  ];

  if (conditions.some(condition => condition)) {
    return false;
  }

  // 배열 비교, 배열 내부 값 비교
  if (Array.isArray(target1) && Array.isArray(target2)) {
    return target1.length === target2.length && target1.every((value, index) => deepEquals(value, target2[index]));
  }

  // 객체 비교
  const target1Keys = Object.keys(target1);
  const target2Keys = Object.keys(target2);

  if (target1Keys.length !== target2Keys.length) {
    return false;
  }

  return target1Keys.every(key => deepEquals(target1[key], target2[key]));
}


export function createNumber1(n) {
  return {
    value: n,
    valueOf() {
      return this.value;
    },
  }
}

export function createNumber2(n) {
  return {
    value: n,
    valueOf() {
      return this.value + "";
    },
  }
}

export function createNumber3(n) {
  return {
    value:n,
    toJSON() {
      return `this is createNumber3 => ${this.value}`;
    },
    toString(){
      return this.value
    },
  };
}


export class CustomNumber {
  static cache = new Map();

  constructor(n){
    if (CustomNumber.cache.has(n)) {
      return CustomNumber.cache.get(n);
    }
    this.value = n;
    CustomNumber.cache.set(n, this);
  }

  valueOf() {
    return this.value;
  }
  toJSON(){
    return this.value + "";
  }
  toString(){
    return this.value + "";
  }
}

export function createUnenumerableObject(target) {
  const result = {};
  
  for (const key in target) {  
    Object.defineProperty(result, key, {
      value: target[key],
      enumerable: false,
      writable:true,
      configurable:true
    });
  }

  return result
}

function isArrayLike(target){
  return (
    target !== null &&
    typeof(target[Symbol.iterator]) === 'function' &&
    typeof(target.length) === 'number' &&
    typeof(target) !== 'string'
  );
}

export function forEach(target, callback) {
  if (Array.isArray(target) || isArrayLike(target)) {
    const iterator = Array.from(target);
    for (let i = 0; i < iterator.length; i++) {
      callback(iterator[i], i);
    }
    return;
  }

  if (typeof target === 'object') {
    const keys = Object.getOwnPropertyNames(target);
    for (const key of keys) {
      callback(target[key], key);
    }
  }
}

export function map(target, callback) {
  let result = [];

  if (Array.isArray(target) || isArrayLike(target)) {
    result = [];
    const iterator = Array.from(target);
    for (const item of iterator) {
      result.push(callback(item));
    }
    return result;
  }
  
  if (typeof target === 'object') {
    result = {};
    const keys = Object.getOwnPropertyNames(target);

    for (const key of keys) {
      result[key] = callback(target[key]);
    }
  }

  return result;
}

export function filter(target, callback) {
  let result = [];

  if (Array.isArray(target) || isArrayLike(target)) {
    result = [];
    const iterator = Array.from(target);
    for (const item of iterator) {
      if (callback(item)) {
        result.push(item);
      }
    }
    return result;
  }

  if (typeof target === 'object') {
    result = {};
    const keys = Object.getOwnPropertyNames(target);

    for (const key of keys) {
      if (callback(target[key])) {
        result[key] = target[key];
      }
    }
  }

  return result;
}


export function every(target, callback) {
  if (Array.isArray(target) || isArrayLike(target)) {
    const iterator = Array.from(target);
    for (const item of iterator) {
      if (!callback(item)) {
        return false;
      }
    }
    return true;
  }
  
  if (typeof target === 'object') {
    const keys = Object.getOwnPropertyNames(target);

    for (const key of keys) {
      if (!callback(target[key])) {
        return false;
      }
    }
    return true;
  }

  return true;
}

export function some(target, callback) {
  if (Array.isArray(target) || isArrayLike(target)) {
    const iterator = Array.from(target);
    for (const item of iterator) {
      if (callback(item)) {
        return true;
      }
    }
    return false;
  } 
  
  if (typeof target === 'object') {
    const keys = Object.getOwnPropertyNames(target);

    for (const key of keys) {
      if (callback(target[key])) {
        return true;
      }
    }
    return false;
  }

  return false;
}



