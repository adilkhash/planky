import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag } from '../services/tagService';
import { PencilIcon, TrashIcon, BookmarkIcon } from '@heroicons/react/24/outline';

interface TagListItemProps {
  tag: Tag;
  onEdit: () => void;
  onDelete: () => void;
  onViewBookmarks: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}

const TagListItem: React.FC<TagListItemProps> = ({
  tag,
  onEdit,
  onDelete,
  onViewBookmarks,
  isSelected,
  onToggleSelect
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // Handle delete with loading state
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle tag click
  const handleTagClick = () => {
    navigate(`/tags/${tag.id}/details/`);
  };

  return (
    <li
      className={`flex items-center px-4 py-3 hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        />
      </div>
      <div className="flex-grow">
        <div className="flex items-center">
          <button
            onClick={handleTagClick}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 hover:bg-primary-200 transition-colors"
          >
            {tag.name}
          </button>
          {tag.is_ai_generated && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              AI Generated
            </span>
          )}
        </div>
      </div>
      <div className="w-24 text-center">
        <span className="text-gray-600">
          {typeof tag.bookmark_count === 'number' ? tag.bookmark_count : '—'}
        </span>
      </div>
      <div className="w-24 flex justify-center space-x-2">
        {isDeleting ? (
          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-600"></div>
        ) : (
          <>
            <button
              onClick={onViewBookmarks}
              className="text-gray-500 hover:text-primary-600 p-1"
              title="View bookmarks with this tag"
              disabled={!tag.bookmark_count}
            >
              <BookmarkIcon className={`h-5 w-5 ${!tag.bookmark_count ? 'opacity-50' : ''}`} />
            </button>
            <button
              onClick={onEdit}
              className="text-gray-500 hover:text-blue-600 p-1"
              title="Edit tag"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-500 hover:text-red-600 p-1"
              title="Delete tag"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </>
        )}
      </div>
    </li>
  );
};

export default TagListItem;
