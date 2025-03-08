import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline';
import { searchService, SearchSuggestions, SearchHistory } from '../services/searchService';
import { debounce } from 'lodash';

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  showHistory?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  initialQuery = '',
  onSearch,
  placeholder = 'Search bookmarks...',
  showHistory = true,
  autoFocus = false,
  className = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestions>({ tags: [], titles: [] });
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Focus the input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Fetch recent searches when component mounts
  useEffect(() => {
    if (showHistory) {
      const fetchRecentSearches = async () => {
        try {
          const searches = await searchService.getRecentSearches();
          setRecentSearches(searches);
        } catch (error) {
          console.error('Error fetching recent searches:', error);
        }
      };

      fetchRecentSearches();
    }
  }, [showHistory]);

  // Create a debounced function for fetching suggestions
  const debouncedFetchSuggestions = useRef(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length >= 2) {
        try {
          const suggestionsData = await searchService.getSearchSuggestions(searchQuery);
          setSuggestions(suggestionsData);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
        }
      } else {
        setSuggestions({ tags: [], titles: [] });
      }
    }, 300)
  ).current;

  // Update suggestions when query changes
  useEffect(() => {
    if (isFocused && query) {
      debouncedFetchSuggestions(query);
      setShowSuggestions(true);
    } else {
      setSuggestions({ tags: [], titles: [] });
      setShowSuggestions(false);
    }

    return () => {
      debouncedFetchSuggestions.cancel();
    };
  }, [query, isFocused, debouncedFetchSuggestions]);

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Set up keyboard shortcut (/) to focus the search bar
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcut if user is typing in an input field or textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Focus search bar when / is pressed
      if (event.key === '/' && inputRef.current) {
        event.preventDefault();
        inputRef.current.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      // Save query to search history
      searchService.saveSearchQuery(query.trim());

      // Call onSearch callback if provided
      if (onSearch) {
        onSearch(query.trim());
      } else {
        // Otherwise, navigate to search results page
        navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      }

      // Update recent searches list
      searchService.getRecentSearches().then(searches => {
        setRecentSearches(searches);
      });

      // Hide suggestions after search
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setShowSuggestions(!!query);
  };

  const handleClearClick = () => {
    setQuery('');
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    setQuery(suggestionText);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Optionally submit the form immediately
    // handleSubmit(new Event('submit') as unknown as React.FormEvent);
  };

  const handleRecentSearchClick = (searchQuery: string) => {
    setQuery(searchQuery);

    // Submit the search immediately
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }

    setShowSuggestions(false);
  };

  const hasSuggestions =
    suggestions.tags.length > 0 ||
    suggestions.titles.length > 0 ||
    (showHistory && recentSearches.length > 0);

  return (
    <div className={`search-bar-container relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            className="input pl-10 pr-10 w-full"
            aria-label="Search"
            autoComplete="off"
            spellCheck="false"
          />

          {query && (
            <button
              type="button"
              onClick={handleClearClick}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {!query && !isFocused && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded">
            /
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && hasSuggestions && (
          <div
            ref={suggestionsRef}
            className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-10 border border-gray-300 max-h-72 overflow-y-auto"
          >
            {/* Recent searches */}
            {showHistory && recentSearches.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-1 px-2">Recent Searches</div>
                {recentSearches.map((search, index) => (
                  <button
                    key={`${search.id}-${index}`}
                    type="button"
                    onClick={() => handleRecentSearchClick(search.query)}
                    className="flex items-center w-full text-left p-2 hover:bg-gray-100 rounded-md"
                  >
                    <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700">{search.query}</span>
                  </button>
                ))}
                <div className="border-t border-gray-200 my-1"></div>
              </div>
            )}

            {/* Tag suggestions */}
            {suggestions.tags.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-1 px-2">Tags</div>
                {suggestions.tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleSuggestionClick(tag.name)}
                    className="flex items-center w-full text-left p-2 hover:bg-gray-100 rounded-md"
                  >
                    <span className="text-xs bg-primary-100 text-primary-800 rounded-full px-2 py-0.5 mr-2">
                      {tag.name}
                    </span>
                    <span className="text-gray-700">Tag</span>
                  </button>
                ))}
                <div className="border-t border-gray-200 my-1"></div>
              </div>
            )}

            {/* Title suggestions */}
            {suggestions.titles.length > 0 && (
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-1 px-2">Bookmarks</div>
                {suggestions.titles.map((title) => (
                  <button
                    key={title.id}
                    type="button"
                    onClick={() => handleSuggestionClick(title.title)}
                    className="flex items-center w-full text-left p-2 hover:bg-gray-100 rounded-md"
                  >
                    <span className="text-gray-700 truncate">{title.title}</span>
                  </button>
                ))}
                <div className="border-t border-gray-200 my-1"></div>
              </div>
            )}

            {/* Search action */}
            <button
              type="submit"
              className="flex items-center w-full text-left p-2 hover:bg-gray-100 text-primary-700"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              <span>
                Search for <span className="font-medium">"{query}"</span>
              </span>
              <span className="ml-auto">
                <ArrowUpIcon className="h-4 w-4 transform -rotate-45" />
              </span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchBar;