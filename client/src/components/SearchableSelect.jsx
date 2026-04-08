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

    return options.filter((option) => String(option).toLowerCase().includes(normalizedSearch));
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
      {label && <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) {
            return;
          }
          setIsOpen((previous) => !previous);
        }}
        className={`relative w-full rounded-md border py-2 pl-3 pr-10 text-left text-sm focus:outline-none ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500"
            : "border-gray-300 text-gray-700 focus:border-primary"
        }`}
      >
        <span className="block truncate">{selectedLabel || placeholder}</span>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-200 p-2">
            <div className="flex items-center gap-2 rounded-md border border-gray-300 px-2 py-1.5">
              <Search size={14} className="text-gray-400" aria-hidden="true" />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search..."
                autoFocus
                className="w-full text-sm text-gray-700 outline-none"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto py-1 text-sm">
            <button
              type="button"
              onClick={() => handleSelect("")}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${!value ? "bg-primary-light text-primary" : "text-gray-700"}`}
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
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 ${value === optionValue ? "bg-primary-light text-primary" : "text-gray-700"}`}
                >
                  {optionValue}
                </button>
              );
            })}

            {filteredOptions.length === 0 && <p className="px-3 py-2 text-gray-500">No values found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
