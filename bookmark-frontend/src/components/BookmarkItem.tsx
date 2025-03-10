import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Bookmark } from '../services/bookmarkService';
import {
  PencilIcon,
  TrashIcon,
  LinkIcon,
  StarIcon,
  EllipsisHorizontalIcon,
  BookmarkIcon as PinIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, BookmarkIcon as PinIconSolid } from '@heroicons/react/24/solid';

interface BookmarkItemProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmarkId: number) => void;
  onToggleFavorite: (bookmark: Bookmark) => void;
  onTogglePin: (bookmark: Bookmark) => void;
}

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  onEdit,
  onDelete,
  onToggleFavorite,
  onTogglePin,
}) => {
  const [showActions, setShowActions] = React.useState(false);
  const navigate = useNavigate();

  // Format the created date
  const formattedDate = bookmark.created_at
    ? formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })
    : '';

  // Truncate long titles and URLs
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Extract domain from URL for display
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return url;
    }
  };

  // Handle tag click
  const handleTagClick = (tagId: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/tags/${tagId}/details/`);
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 relative"
      aria-label={`Bookmark: ${bookmark.title}`}
    >
      <div className="flex items-start">
        {/* Favicon */}
        <div className="mr-3 mt-1 flex-shrink-0">
          {bookmark.favicon_url ? (
            <img
              src={bookmark.favicon_url}
              alt=""
              className="w-6 h-6"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/favicon-fallback.png';
                target.onerror = null; // Prevent infinite loop
              }}
            />
          ) : (
            <LinkIcon className="w-6 h-6 text-gray-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-grow min-w-0">
          <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">
            {bookmark.title}
          </h3>

          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:underline truncate block mb-2"
          >
            {getDomain(bookmark.url)}
          </a>

          {bookmark.description && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {bookmark.description}
            </p>
          )}

          {/* Tags */}
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {bookmark.tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={(e) => handleTagClick(tag.id, e)}
                  className="inline-block px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-full hover:bg-primary-200 transition-colors cursor-pointer"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>

        {/* Quick actions */}
        <div className="ml-3 flex flex-col items-center space-y-1">
          <button
            onClick={() => onToggleFavorite(bookmark)}
            className="text-gray-400 hover:text-yellow-500 focus:outline-none p-1"
            aria-label={bookmark.is_favorite ? "Remove from favorites" : "Add to favorites"}
            title={bookmark.is_favorite ? "Remove from favorites" : "Add to favorites"}
          >
            {bookmark.is_favorite ? (
              <StarIconSolid className="h-5 w-5 text-yellow-500" />
            ) : (
              <StarIcon className="h-5 w-5" />
            )}
          </button>

          <button
            onClick={() => onTogglePin(bookmark)}
            className="text-gray-400 hover:text-primary-600 focus:outline-none p-1"
            aria-label={bookmark.is_pinned ? "Unpin bookmark" : "Pin bookmark"}
            title={bookmark.is_pinned ? "Unpin bookmark" : "Pin bookmark"}
          >
            {bookmark.is_pinned ? (
              <PinIconSolid className="h-5 w-5 text-primary-600" />
            ) : (
              <PinIcon className="h-5 w-5" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
              aria-label="More actions"
              aria-expanded={showActions}
              aria-haspopup="true"
            >
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>

            {/* Dropdown menu */}
            {showActions && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg py-1 z-10 text-sm">
                <button
                  onClick={() => {
                    onEdit(bookmark);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </button>

                <button
                  onClick={() => {
                    onDelete(bookmark.id);
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkItem;
