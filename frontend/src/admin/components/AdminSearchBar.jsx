import React from "react";
import { FiSearch } from "react-icons/fi";

export default function AdminSearchBar({
  value,
  onChange,
  placeholder = "Search...",
}) {
  return (
    <div className="admin-search">
      <FiSearch size={18} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
