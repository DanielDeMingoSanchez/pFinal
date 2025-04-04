import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSearch, FaTimes } from 'react-icons/fa';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void; // 🔥 Recibe un string en vez de un array
  className?: string;
  initialQuery?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Buscar...", 
  onSearch,
  className = "",
  initialQuery = ""
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (initialQuery) {
      handleSearch();
    }
  }, [initialQuery]);

  const handleSearch = () => {
    onSearch(searchQuery.trim()); // 🔥 Pasa el texto de búsqueda directamente
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    onSearch(''); // 🔥 Reiniciar búsqueda
  };

  return (
    <div className={`relative ${className}`}>
      <motion.div 
        className="flex items-center border border-gray-300 dark:border-gray-600 rounded-full overflow-hidden bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-300 w-full px-4 py-2"
      >
        <FaSearch className="text-gray-500 dark:text-gray-400 mr-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            onSearch(e.target.value.trim()); // 🔥 Llamar a `onSearch` en tiempo real
          }}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white"
        />
        {searchQuery && (
          <button onClick={clearSearch} className="text-gray-500 dark:text-gray-400">
            <FaTimes />
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default SearchBar;
