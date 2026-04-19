import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * SearchBar — Debounced search input.
 * Uses useRef for debounce timer.
 * Props:
 *   - value: controlled value
 *   - onChange(value): called with debounced value
 *   - placeholder: input placeholder
 *   - id: unique ID
 */
export default function SearchBar({ value, onChange, placeholder = 'Search...', id = 'search-bar' }) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef(null);

  // Sync local state when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    // useRef: Debounce the search callback
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  }, [onChange]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="search-wrapper">
      <span className="search-icon">🔍</span>
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        id={id}
        autoComplete="off"
      />
    </div>
  );
}
