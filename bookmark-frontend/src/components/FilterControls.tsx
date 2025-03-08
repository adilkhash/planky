import React, { useState, useEffect } from 'react';
import { StarIcon, BookmarkIcon, TagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import { tagService, Tag } from '../services/tagService';

interface FilterControlsProps {
  onFilterChange: (filters: {
    tags: number[];
    favorite: boolean | null;
    pinned: boolean | null;
  }) => void;
  initialFilters?: {
    tags: number[];
    favorite: boolean | null;
    pinned: boolean | null;
  };
  className?: string;
  showClearButton?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  onFilterChange,
  initialFilters = { tags: [], favorite: null, pinned: null },
  className = '',
  showClearButton = true,
}) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>(initialFilters.tags || []);
  const [favoriteFilter, setFavoriteFilter] = useState<boolean | null>(initialFilters.favorite);
  const [pinnedFilter, setPinnedFilter] = useState<boolean | null>(initialFilters.pinned);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load available tags
  useEffect(() => {
    const fetchTags = async () => {
      setLoading(true);
      try {
        const tags = await tagService.getTags({ include_count: true });
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Call onFilterChange when filters change
  useEffect(() => {
    onFilterChange({
      tags: selectedTags,
      favorite: favoriteFilter,
      pinned: pinnedFilter
    });
  }, [selectedTags, favoriteFilter, pinnedFilter, onFilterChange]);

  // Toggle tag selection
  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // Toggle favorite filter
  const toggleFavoriteFilter = () => {
    setFavoriteFilter(current => {
      if (current === true) return null;
      return current === null ? true : null;
    });
  };

  // Toggle pinned filter
  const togglePinnedFilter = () => {
    setPinnedFilter(current => {
      if (current === true) return null;
      return current === null ? true : null;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([]);
    setFavoriteFilter(null);
    setPinnedFilter(null);
  };

  // Get tag name by ID
  const getTagNameById = (tagId: number) => {
    const tag = availableTags.find(tag => tag.id === tagId);
    return tag ? tag.name : '';
  };

  // Check if any filters are active
  const isFiltering = selectedTags.length > 0 || favoriteFilter !== null || pinnedFilter !== null;

  return (
    <div className={`filter-controls ${className}`}>
      <div className="flex flex-wrap gap-2 items-center">
        {/* Tag filter dropdown */}
        <div className="relative">
          <button
            type="button"
            className={`px-3 py-2 border rounded-md text-sm font-medium flex items-center space-x-1 ${
              selectedTags.length > 0
                ? 'bg-primary-50 text-primary-700 border-primary-300'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            aria-expanded={tagDropdownOpen}
          >
            <TagIcon className="h-4 w-4 mr-1" />
            <span>Tags</span>
            {selectedTags.length > 0 && (
              <span className="ml-1 text-xs bg-primary-100 text-primary-800 rounded-full px-2 py-0.5">
                {selectedTags.length}
              </span>
            )}
          </button>

          {/* Tag dropdown */}
          {tagDropdownOpen && (
            <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg py-1 w-64">
              <div className="max-h-64 overflow-y-auto p-2">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-500 text-sm mt-2">Loading tags...</p>
                  </div>
                ) : availableTags.length === 0 ? (
                  <p className="text-gray-500 text-sm p-2">No tags found</p>
                ) : (
                  <div className="space-y-1">
                    {availableTags.map(tag => (
                      <div
                        key={tag.id}
                        className="flex items-center"
                      >
                        <label className="flex items-center p-2 w-full rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTags.includes(tag.id)}
                            onChange={() => toggleTag(tag.id)}
                            className="h-4 w-4 text-primary-600 rounded"
                          />
                          <span className="ml-2 text-gray-700 flex-grow">{tag.name}</span>
                          {tag.bookmark_count !== undefined && (
                            <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                              {tag.bookmark_count}
                            </span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-gray-100 px-2 py-1">
                <button
                  type="button"
                  onClick={() => setSelectedTags([])}
                  disabled={selectedTags.length === 0}
                  className={`text-xs px-2 py-1 rounded ${
                    selectedTags.length === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  Clear tag selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Favorite filter toggle */}
        <button
          type="button"
          onClick={toggleFavoriteFilter}
          className={`px-3 py-2 border rounded-md text-sm font-medium flex items-center ${
            favoriteFilter === true
              ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          aria-pressed={favoriteFilter === true}
        >
          {favoriteFilter === true ? (
            <StarIconSolid className="h-4 w-4 mr-1 text-yellow-500" />
          ) : (
            <StarIcon className="h-4 w-4 mr-1" />
          )}
          <span>Favorites</span>
        </button>

        {/* Pinned filter toggle */}
        <button
          type="button"
          onClick={togglePinnedFilter}
          className={`px-3 py-2 border rounded-md text-sm font-medium flex items-center ${
            pinnedFilter === true
              ? 'bg-primary-50 text-primary-700 border-primary-300'
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          aria-pressed={pinnedFilter === true}
        >
          {pinnedFilter === true ? (
            <BookmarkIconSolid className="h-4 w-4 mr-1 text-primary-600" />
          ) : (
            <BookmarkIcon className="h-4 w-4 mr-1" />
          )}
          <span>Pinned</span>
        </button>

        {/* Clear all filters button */}
        {showClearButton && isFiltering && (
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 text-gray-600 hover:text-gray-900 text-sm flex items-center"
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            <span>Clear filters</span>
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {isFiltering && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedTags.map(tagId => (
            <div
              key={tagId}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-primary-100 text-primary-800"
            >
              <TagIcon className="h-3.5 w-3.5 mr-1" />
              <span>{getTagNameById(tagId)}</span>
              <button
                type="button"
                onClick={() => toggleTag(tagId)}
                className="ml-1 text-primary-500 hover:text-primary-700"
                aria-label={`Remove ${getTagNameById(tagId)} filter`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}

          {favoriteFilter === true && (
            <div
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-yellow-100 text-yellow-800"
            >
              <StarIconSolid className="h-3.5 w-3.5 mr-1 text-yellow-500" />
              <span>Favorites</span>
              <button
                type="button"
                onClick={() => setFavoriteFilter(null)}
                className="ml-1 text-yellow-500 hover:text-yellow-700"
                aria-label="Remove favorites filter"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}

          {pinnedFilter === true && (
            <div
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-primary-100 text-primary-800"
            >
              <BookmarkIconSolid className="h-3.5 w-3.5 mr-1 text-primary-600" />
              <span>Pinned</span>
              <button
                type="button"
                onClick={() => setPinnedFilter(null)}
                className="ml-1 text-primary-500 hover:text-primary-700"
                aria-label="Remove pinned filter"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterControls;
