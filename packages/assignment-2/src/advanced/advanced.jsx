import { createContext, useCallback, useContext, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { deepEquals } from '../basic/basic';

const cache = new Map();

export const memo1 = (fn) => {
  if (cache.has(fn)) {
    return cache.get(fn);
  }
  const result = fn();
  cache.set(fn, result);
  return result;
};

export const memo2 = (fn, dependencies = []) => {
  const key = JSON.stringify({ fn: fn.toString(), dependencies });
  if (cache.has(key)) {
    return cache.get(key);
  }
  const result = fn();
  cache.set(key, result);
  return result;
};


export const useCustomState = (initValue) => {
  const [value, originalSetValue] = useState(initValue);

  const setValue = useCallback((newValue) => {
    const computedValue = typeof newValue === 'function' ? newValue(value) : newValue;
    if (deepEquals(value, computedValue)) {
      return;
    }
    originalSetValue(prevValue => {
      return typeof newValue === 'function' ? newValue(prevValue) : newValue;
    });
  }, [originalSetValue, value]); 

  return [value, setValue];
}

const textContextDefaultValue = {
  user: null,
  todoItems: [],
  count: 0,
};

export const TestContext = createContext({
  get: () => null,
  set: () => null,
  subscribe: () => null,
});

export const TestContextProvider = ({ children }) => {
  const valueRef = useRef(textContextDefaultValue);
  const subscribersRef = useRef(new Set());

  const set = useCallback((newValue) => {
    valueRef.current = { ...valueRef.current, ...newValue };
    subscribersRef.current.forEach((fn) => fn());
  }, []);

  const get = useCallback(() => {
    return valueRef.current;
  }, []);

  const subscribe = useCallback((fn) => {
    subscribersRef.current.add(fn);
    return () => {
      subscribersRef.current.delete(fn);
    };
  }, []);

  const value = useMemo(() => ({ get, set, subscribe }), [get, set, subscribe]);

  return (
    <TestContext.Provider value={value}>
      {children}
    </TestContext.Provider>
  )
}

const useTestContext = () => {
  return useContext(TestContext);
}

export const useUser = () => {
  const { get, set, subscribe } = useTestContext();
  const state = useSyncExternalStore(subscribe, () => get().user, get);

  const setUser = useCallback((user) => {
    set({ user });
  }, [set]);

  return [
    state,
    setUser
  ];
}

export const useCounter = () => {
  const { get, set, subscribe } = useTestContext();
  const state = useSyncExternalStore(subscribe, () => get().count, get);

  const setCount = useCallback((count) => {
    set({ count });
  }, [set]);

  return [
    state,
    setCount
  ];
}

export const useTodoItems = () => {
  const { get, set, subscribe } = useTestContext();
  const state = useSyncExternalStore(subscribe, () => get().todoItems, get);

  const setTodoItems = useCallback((todoItems) => {
    set({ todoItems });
  }, [set]);

  return [
    state,
    setTodoItems
  ];
}
