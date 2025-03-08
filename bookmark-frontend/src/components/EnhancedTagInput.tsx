import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, TagIcon } from '@heroicons/react/24/outline';
import { Tag, tagService } from '../services/tagService';

interface EnhancedTagInputProps {
  selectedTags: Tag[];
  onChange: (tags: Tag[]) => void;
  disabled?: boolean;
  maxTags?: number;
}

const EnhancedTagInput: React.FC<EnhancedTagInputProps> = ({
  selectedTags,
  onChange,
  disabled = false,
  maxTags = 20,
}) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch available tags on component mount
  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true);
      try {
        const tags = await tagService.getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  // Close suggestions when clicking outside
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

  // Filter available tags based on input and selected tags
  const filteredTags = availableTags
    .filter(tag => !selectedTags.some(selectedTag => selectedTag.id === tag.id))
    .filter(tag => tagInput ? tag.name.toLowerCase().includes(tagInput.toLowerCase()) : true)
    .slice(0, 10); // Limit to 10 suggestions

  // Handle adding a tag
  const handleAddTag = async (tagName: string, isExistingTag = false) => {
    const trimmedName = tagName.trim().toLowerCase();

    if (!trimmedName) {
      return;
    }

    // Check if we've reached the max number of tags
    if (selectedTags.length >= maxTags) {
      setError(`You can only add up to ${maxTags} tags`);
      return;
    }

    // Check if tag already exists in selected tags
    if (selectedTags.some(tag => tag.name.toLowerCase() === trimmedName)) {
      setError('This tag is already added');
      return;
    }

    // Check if tag exists in available tags
    const existingTag = availableTags.find(tag =>
      tag.name.toLowerCase() === trimmedName
    );

    if (existingTag || isExistingTag) {
      // Add existing tag
      const tagToAdd = existingTag || { name: trimmedName };
      onChange([...selectedTags, tagToAdd]);
      setTagInput('');
      setError(null);
      setShowSuggestions(false);
    } else {
      // Create a new tag
      setIsCreatingTag(true);
      try {
        // Optimistically add the tag with a temporary ID
        const tempTag = { id: -Date.now(), name: trimmedName };
        onChange([...selectedTags, tempTag]);

        // Create the tag on the server
        const newTag = await tagService.createTag({ name: trimmedName });

        // Replace the temporary tag with the real one
        onChange(selectedTags.map(tag =>
          (tag.id === tempTag.id) ? newTag : tag
        ).concat(newTag.id === tempTag.id ? [] : [newTag]));

        // Update available tags
        setAvailableTags(prevTags => [...prevTags, newTag]);

      } catch (error) {
        console.error('Error creating tag:', error);
        setError('Failed to create tag. Please try again.');

        // Remove the temporary tag on error
        onChange(selectedTags.filter(tag => tag.name !== trimmedName));
      } finally {
        setIsCreatingTag(false);
        setTagInput('');
        setShowSuggestions(false);
      }
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: Tag) => {
    onChange(selectedTags.filter(tag =>
      tag.id !== tagToRemove.id
    ));
  };

  // Handle input keydown (add tag on Enter, navigate suggestions on arrow keys)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown' && showSuggestions) {
      e.preventDefault();
      // Focus the first suggestion
      const suggestions = suggestionsRef.current?.querySelectorAll('button');
      if (suggestions && suggestions.length > 0) {
        (suggestions[0] as HTMLButtonElement).focus();
      }
    }
  };

  // Handle suggestion keydown for keyboard navigation
  const handleSuggestionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const suggestions = suggestionsRef.current?.querySelectorAll('button');
    if (!suggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (index < suggestions.length - 1) {
        (suggestions[index + 1] as HTMLButtonElement).focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (index > 0) {
        (suggestions[index - 1] as HTMLButtonElement).focus();
      } else {
        // Focus back on the input
        inputRef.current?.focus();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div>
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tag, index) => (
          <div
            key={tag.id || `new-tag-${index}`}
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm ${
              tag.id < 0 
                ? 'bg-yellow-100 text-yellow-800' // Temporary tag being created
                : 'bg-primary-100 text-primary-800'
            }`}
          >
            {tag.id < 0 && (
              <div className="mr-1 h-3 w-3 text-yellow-600 animate-pulse">
                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            <TagIcon className="h-3 w-3 mr-1" />
            <span className="max-w-xs truncate">{tag.name}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="ml-1 text-primary-700 hover:text-primary-900 focus:outline-none"
              aria-label={`Remove tag ${tag.name}`}
              disabled={disabled}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Tag input and suggestions */}
      <div className="relative">
        <div className="flex">
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                if (error) setError(null);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={selectedTags.length ? "Add another tag..." : "Add a tag..."}
              className="input flex-grow pl-9"
              disabled={disabled || isCreatingTag}
              maxLength={50}
            />
            <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>

          <button
            type="button"
            onClick={() => handleAddTag(tagInput)}
            disabled={!tagInput.trim() || disabled || isCreatingTag}
            className="ml-2 px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 flex items-center"
          >
            {isCreatingTag ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-transparent"></div>
            ) : (
              <PlusIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Tag suggestions */}
        {showSuggestions && (tagInput || filteredTags.length > 0) && (
          <div
            ref={suggestionsRef}
            className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg overflow-hidden"
          >
            {isLoading ? (
              <div className="p-2 text-center text-gray-500">
                Loading tags...
              </div>
            ) : filteredTags.length === 0 ? (
              <div className="p-3 text-gray-500">
                {tagInput ? (
                  <div>
                    <p>No matching tags found.</p>
                    <p className="text-sm mt-1">
                      Press <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded-sm">Enter</kbd> to create a new tag.
                    </p>
                  </div>
                ) : (
                  <p>No tags available. Type to create a new tag.</p>
                )}
              </div>
            ) : (
              <ul className="max-h-60 overflow-auto py-1" role="listbox">
                {filteredTags.map((tag, index) => (
                  <li key={tag.id}>
                    <button
                      type="button"
                      onClick={() => handleAddTag(tag.name, true)}
                      onKeyDown={(e) => handleSuggestionKeyDown(e, index)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      role="option"
                    >
                      <TagIcon className="h-4 w-4 inline-block mr-2 text-gray-500" />
                      {tag.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm mt-1">{error}</div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 mt-1">
        Add tags to organize your bookmarks. Press Enter to add a tag or click the plus button.
      </p>
    </div>
  );
};

export default EnhancedTagInput;
