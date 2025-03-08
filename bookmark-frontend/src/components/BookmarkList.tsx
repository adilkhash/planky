import React, { useState, useEffect } from 'react';
import { bookmarkService, Bookmark, PaginatedResponse } from '../services/bookmarkService';
import BookmarkItem from './BookmarkItem';
import { PlusIcon, ArrowPathIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import BookmarkModal from './BookmarkModal';
import { Tag } from '../services/tagService';

interface BookmarkListProps {
  tagFilter?: number | null;
  searchQuery?: string;
  onlyFavorites?: boolean;
  onlyPinned?: boolean;
}

const BookmarkList: React.FC<BookmarkListProps> = ({
  tagFilter = null,
  searchQuery = '',
  onlyFavorites = false,
  onlyPinned = false,
}) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResponse<Bookmark> | null>(null);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<string>('desc');
  const [showModal, setShowModal] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedBookmarkId, setSelectedBookmarkId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sort options
  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'updated_at', label: 'Date Updated' },
    { value: 'title', label: 'Title' },
  ];

  // Fetch bookmarks with current filters
  const fetchBookmarks = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      const params: Record<string, any> = {
        page,
        ordering: `${sortDirection === 'desc' ? '-' : ''}${sortBy}`,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (tagFilter) {
        params.tag_id = tagFilter;
      }

      if (onlyFavorites) {
        response = await bookmarkService.getFavoriteBookmarks();
      } else if (onlyPinned) {
        response = await bookmarkService.getPinnedBookmarks();
      } else {
        response = await bookmarkService.getBookmarks(params);
      }

      setBookmarks(response.results);
      setPagination(response);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
      setError('Failed to load bookmarks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load bookmarks on component mount and when filters change
  useEffect(() => {
    fetchBookmarks();
  }, [page, sortBy, sortDirection, tagFilter, searchQuery, onlyFavorites, onlyPinned]);

  // Handle creating a new bookmark
  const handleCreateBookmark = async (data: {
    url: string;
    title: string;
    description?: string;
    tag_ids?: number[];
    tag_names?: string[];
  }) => {
    try {
      await bookmarkService.createBookmark(data);
      setShowModal(false);
      fetchBookmarks();
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error; // Re-throw to let the form handle the error
    }
  };

  // Handle updating a bookmark
  const handleUpdateBookmark = async (id: number, data: {
    url?: string;
    title?: string;
    description?: string;
    tag_ids?: number[];
    tag_names?: string[];
  }) => {
    try {
      await bookmarkService.updateBookmark(id, data);
      setShowModal(false);
      setEditingBookmark(null);
      fetchBookmarks();
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  };

  // Handle deleting a bookmark
  const handleDeleteBookmark = async (bookmarkId: number) => {
    setSelectedBookmarkId(bookmarkId);

    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      setIsDeleting(true);
      try {
        await bookmarkService.deleteBookmark(bookmarkId);
        // Remove from local state for immediate feedback
        setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
      } catch (error) {
        console.error('Error deleting bookmark:', error);
        setError('Failed to delete bookmark. Please try again.');
      } finally {
        setIsDeleting(false);
        setSelectedBookmarkId(null);
      }
    }
  };

  // Handle toggling favorite status
  const handleToggleFavorite = async (bookmark: Bookmark) => {
    setSelectedBookmarkId(bookmark.id);
    try {
      const updatedBookmark = await bookmarkService.updateBookmark(bookmark.id, {
        is_favorite: !bookmark.is_favorite
      });

      // Update in local state
      setBookmarks(bookmarks.map(b =>
        b.id === updatedBookmark.id ? updatedBookmark : b
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setSelectedBookmarkId(null);
    }
  };

  // Handle toggling pin status
  const handleTogglePin = async (bookmark: Bookmark) => {
    setSelectedBookmarkId(bookmark.id);
    try {
      const updatedBookmark = await bookmarkService.updateBookmark(bookmark.id, {
        is_pinned: !bookmark.is_pinned
      });

      // Update in local state
      setBookmarks(bookmarks.map(b =>
        b.id === updatedBookmark.id ? updatedBookmark : b
      ));
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setSelectedBookmarkId(null);
    }
  };

  // Function to handle edit button click
  const handleEditClick = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setShowModal(true);
  };

  // Function to handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // If clicking the same field, toggle direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a new field, set it with default desc direction
      setSortBy(field);
      setSortDirection('desc');
    }
    setShowSortOptions(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-semibold">
          {onlyFavorites ? 'Favorite Bookmarks' :
           onlyPinned ? 'Pinned Bookmarks' :
           tagFilter ? 'Bookmarks with Selected Tag' :
           'All Bookmarks'}
        </h2>

        <div className="flex items-center space-x-2">
          {/* Sort dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              aria-haspopup="true"
              aria-expanded={showSortOptions}
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
              Sort
            </button>

            {showSortOptions && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        sortBy === option.value 
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      {option.label}
                      {sortBy === option.value && (
                        <span className="ml-2">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchBookmarks}
            className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            aria-label="Refresh bookmarks"
            disabled={loading}
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Add button */}
          <button
            onClick={() => {
              setEditingBookmark(null);
              setShowModal(true);
            }}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none"
            aria-label="Add new bookmark"
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            Add
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !bookmarks.length ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h3 className="text-xl font-medium mb-2">No bookmarks found</h3>
          <p className="text-gray-600 mb-6">
            {onlyFavorites
              ? "You don't have any favorite bookmarks yet."
              : onlyPinned
              ? "You don't have any pinned bookmarks yet."
              : tagFilter
              ? "No bookmarks with this tag."
              : searchQuery
              ? `No results found for "${searchQuery}".`
              : "You don't have any bookmarks yet."}
          </p>
          <button
            onClick={() => {
              setEditingBookmark(null);
              setShowModal(true);
            }}
            className="btn btn-primary inline-flex items-center gap-1"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Bookmark</span>
          </button>
        </div>
      ) : (
        <>
          {/* Bookmark grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="relative">
                {(selectedBookmarkId === bookmark.id && isDeleting) && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                )}
                <BookmarkItem
                  bookmark={bookmark}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteBookmark}
                  onToggleFavorite={handleToggleFavorite}
                  onTogglePin={handleTogglePin}
                />
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && (pagination.next || pagination.previous) && (
            <div className="mt-6 flex justify-center">
              <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.previous}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border ${
                    !pagination.previous
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } text-sm font-medium`}
                >
                  Previous
                </button>

                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  Page {page} of {Math.ceil(pagination.count / 10)}
                </span>

                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.next}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border ${
                    !pagination.next
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } text-sm font-medium`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Bookmark Modal */}
      <BookmarkModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBookmark(null);
        }}
        onSubmit={editingBookmark ?
          (data) => handleUpdateBookmark(editingBookmark.id, data) :
          handleCreateBookmark}
        bookmark={editingBookmark}
      />

      {/* Floating action button for mobile */}
      <div className="fixed bottom-6 right-6 md:hidden">
        <button
          onClick={() => {
            setEditingBookmark(null);
            setShowModal(true);
          }}
          className="h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center focus:outline-none hover:bg-primary-700"
          aria-label="Add new bookmark"
        >
          <PlusIcon className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

export default BookmarkList;
