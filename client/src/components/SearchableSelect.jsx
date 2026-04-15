import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select",
  emptyLabel = "All",
  disabled = false,
}) {
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return options;
    }

    return options.filter((option) =>
      String(option).toLowerCase().includes(normalizedSearch),
    );
  }, [options, searchText]);

  const selectedLabel = value || emptyLabel;

  const handleSelect = (nextValue) => {
    if (disabled) {
      return;
    }
    onChange(nextValue);
    setIsOpen(false);
    setSearchText("");
  };

  return (
    <div ref={rootRef} className="relative">
      {label && (
        <label className="mb-2 block text-sm font-semibold text-slate-900">
          {label}
        </label>
      )}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }
          setIsOpen((previous) => !previous);
        }}
        className={`relative w-full rounded-lg border py-2.5 pl-4 pr-10 text-left text-sm font-medium transition-all duration-200 focus:outline-none ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
            : isOpen
              ? "border-primary ring-2 ring-primary-light bg-white text-gray-900"
              : "border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary-light"
        }`}
      >
        <span className="block truncate">{selectedLabel || placeholder}</span>
        <ChevronDown
          size={16}
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="border-b border-gray-200 p-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 bg-gray-50 hover:bg-white focus-within:bg-white transition-colors">
              <Search
                size={14}
                className="flex-shrink-0 text-gray-400"
                aria-hidden="true"
              />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-full text-sm text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 text-sm">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors duration-150 ${!value ? "bg-primary-light text-primary" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {emptyLabel}
            </button>

            {filteredOptions.map((option) => {
              const optionValue = String(option);
              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() => handleSelect(optionValue)}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors duration-150 ${value === optionValue ? "bg-primary-light text-primary" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  {optionValue}
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <p className="px-4 py-3 text-center text-sm text-gray-500">
                No values found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
