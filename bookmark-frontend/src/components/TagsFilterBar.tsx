import React, { useState, useEffect, useRef } from 'react';
import {
  TagIcon,
  XMarkIcon,
  ChevronDownIcon,
  FilterIcon
} from '@heroicons/react/24/outline';
import { Tag, tagService } from '../services/tagService';

interface TagsFilterBarProps {
  selectedTags: Tag[];
  onTagSelect: (tag: Tag) => void;
  onTagRemove: (tagId: number) => void;
  onClearAll: () => void;
  className?: string;
}

const TagsFilterBar: React.FC<TagsFilterBarProps> = ({
  selectedTags,
  onTagSelect,
  onTagRemove,
  onClearAll,
  className = '',
}) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const tags = await tagService.getTags({ include_count: true });
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter tags based on search query and selected tags
  const filteredTags = availableTags
    .filter(tag => !selectedTags.some(selectedTag => selectedTag.id === tag.id))
    .filter(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => (b.bookmark_count || 0) - (a.bookmark_count || 0));

  // No filters applied
  if (selectedTags.length === 0 && !showDropdown) {
    return (
      <div className={`flex items-center ${className}`}>
        <button
          onClick={() => setShowDropdown(true)}
          className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center"
        >
          <FilterIcon className="h-5 w-5 mr-2 text-gray-500" />
          Filter by Tags
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Selected tags */}
        {selectedTags.map(tag => (
          <div
            key={tag.id}
            className="bg-primary-100 text-primary-800 rounded-full px-3 py-1 flex items-center text-sm"
          >
            <TagIcon className="h-4 w-4 mr-1" />
            <span>{tag.name}</span>
            <button
              onClick={() => onTagRemove(tag.id)}
              className="ml-1 text-primary-600 hover:text-primary-800"
              aria-label={`Remove tag ${tag.name}`}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Tag selector dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 flex items-center"
            aria-expanded={showDropdown}
            aria-haspopup="listbox"
          >
            <TagIcon className="h-5 w-5 mr-1 text-gray-500" />
            {showDropdown ? 'Close' : 'Add Tag'}
            <ChevronDownIcon className={`h-4 w-4 ml-1 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute z-10 mt-1 w-64 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
              <div className="px-3 py-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tags..."
                  className="input w-full text-sm"
                  autoFocus
                />
              </div>

              {isLoading ? (
                <div className="px-3 py-2 text-center text-gray-500">
                  Loading tags...
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="px-3 py-2 text-center text-gray-500">
                  {searchQuery ? 'No matching tags found' : 'No more tags available'}
                </div>
              ) : (
                <ul role="listbox" className="py-1">
                  {filteredTags.map(tag => (
                    <li key={tag.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onTagSelect(tag);
                          setShowDropdown(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                      >
                        <span className="flex items-center">
                          <TagIcon className="h-4 w-4 mr-2 text-gray-500" />
                          {tag.name}
                        </span>
                        {tag.bookmark_count !== undefined && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                            {tag.bookmark_count}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Clear button (only show if there are selected tags) */}
        {selectedTags.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

export default TagsFilterBar;
