import { useState, useEffect } from 'react';

/**
 * A custom hook that delays updating a value until after a specified delay.
 * Useful for reducing API calls during fast typing.
 *
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if the value changes before the delay period
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
