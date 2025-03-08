import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Layout from '../components/Layout';
import NotesEditor from '../components/NotesEditor';
import { bookmarkService, Bookmark } from '../services/bookmarkService';
import {
  StarIcon,
  PencilIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  BookmarkIcon,
  LinkIcon,
  TagIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, BookmarkIcon as BookmarkIconSolid } from '@heroicons/react/24/solid';
import BookmarkModal from '../components/BookmarkModal';

const BookmarkDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updating, setUpdating] = useState<'favorite' | 'pin' | null>(null);

  useEffect(() => {
    const fetchBookmark = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const bookmarkId = parseInt(id);
        const data = await bookmarkService.getBookmark(bookmarkId);
        setBookmark(data);
      } catch (err) {
        console.error('Error fetching bookmark:', err);
        setError('Failed to load bookmark details. It may have been deleted or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookmark();
  }, [id]);

  // Handle toggling favorite status
  const handleToggleFavorite = async () => {
    if (!bookmark) return;

    setUpdating('favorite');
    try {
      const updatedBookmark = await bookmarkService.updateBookmark(bookmark.id, {
        is_favorite: !bookmark.is_favorite
      });
      setBookmark(updatedBookmark);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Handle toggling pin status
  const handleTogglePin = async () => {
    if (!bookmark) return;

    setUpdating('pin');
    try {
      const updatedBookmark = await bookmarkService.updateBookmark(bookmark.id, {
        is_pinned: !bookmark.is_pinned
      });
      setBookmark(updatedBookmark);
    } catch (error) {
      console.error('Error toggling pin:', error);
    } finally {
      setUpdating(null);
    }
  };

  // Handle deleting bookmark
  const handleDelete = async () => {
    if (!bookmark) return;

    if (window.confirm('Are you sure you want to delete this bookmark? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await bookmarkService.deleteBookmark(bookmark.id);
        navigate('/bookmarks', { replace: true });
      } catch (error) {
        console.error('Error deleting bookmark:', error);
        setError('Failed to delete bookmark. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  // Handle updating bookmark
  const handleUpdateBookmark = async (data: any) => {
    if (!bookmark) return;

    try {
      const updatedBookmark = await bookmarkService.updateBookmark(bookmark.id, data);
      setBookmark(updatedBookmark);
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error; // Re-throw to let the form handle the error
    }
  };

  // Handle updating notes
  const handleUpdateNotes = async (bookmarkId: number, notes: string) => {
    try {
      const updatedBookmark = await bookmarkService.updateBookmark(bookmarkId, { notes });
      setBookmark(updatedBookmark);
    } catch (error) {
      console.error('Error updating notes:', error);
      throw error;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPpp'); // e.g. "Jan 1, 2021, 12:00 PM"
    } catch (e) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !bookmark) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 text-red-800 p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error || 'Bookmark not found'}</p>
            <button
              onClick={() => navigate('/bookmarks')}
              className="mt-4 inline-flex items-center text-red-700 hover:text-red-900"
            >
              <ArrowUturnLeftIcon className="h-5 w-5 mr-1" />
              Return to bookmarks
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/bookmarks')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowUturnLeftIcon className="h-5 w-5 mr-1" />
            Back to bookmarks
          </button>
        </div>

        {/* Bookmark detail card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header with title and actions */}
          <div className="flex flex-wrap justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mr-4 mb-2">{bookmark.title}</h1>

            <div className="flex space-x-2">
              <button
                onClick={handleToggleFavorite}
                disabled={updating === 'favorite'}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label={bookmark.is_favorite ? "Remove from favorites" : "Add to favorites"}
              >
                {updating === 'favorite' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500"></div>
                ) : bookmark.is_favorite ? (
                  <StarIconSolid className="h-6 w-6 text-yellow-500" />
                ) : (
                  <StarIcon className="h-6 w-6 text-gray-400 hover:text-yellow-500" />
                )}
              </button>

              <button
                onClick={handleTogglePin}
                disabled={updating === 'pin'}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label={bookmark.is_pinned ? "Unpin bookmark" : "Pin bookmark"}
              >
                {updating === 'pin' ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600"></div>
                ) : bookmark.is_pinned ? (
                  <BookmarkIconSolid className="h-6 w-6 text-primary-600" />
                ) : (
                  <BookmarkIcon className="h-6 w-6 text-gray-400 hover:text-primary-600" />
                )}
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="Edit bookmark"
              >
                <PencilIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="Delete bookmark"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-600"></div>
                ) : (
                  <TrashIcon className="h-6 w-6 text-gray-400 hover:text-red-600" />
                )}
              </button>
            </div>
          </div>

          {/* URL with clickable link */}
          <div className="mb-6">
            <div className="flex items-center text-gray-500 mb-1">
              <LinkIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">URL</span>
            </div>
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline break-all"
            >
              {bookmark.url}
            </a>
          </div>

          {/* Description */}
          {bookmark.description && (
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
              <p className="text-gray-700">{bookmark.description}</p>
            </div>
          )}

          {/* Tags */}
          <div className="mb-6">
            <div className="flex items-center text-gray-500 mb-2">
              <TagIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">Tags</span>
            </div>

            {bookmark.tags && bookmark.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {bookmark.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No tags</p>
            )}
          </div>

          {/* Metadata (creation date, etc.) */}
          <div className="mb-6">
            <div className="flex items-center text-gray-500 mb-2">
              <ClockIcon className="h-5 w-5 mr-2" />
              <span className="text-sm">Created</span>
            </div>
            <p className="text-gray-700">{formatDate(bookmark.created_at)}</p>

            {bookmark.created_at !== bookmark.updated_at && (
              <p className="text-gray-500 text-sm mt-1">
                Last updated: {formatDate(bookmark.updated_at)}
              </p>
            )}
          </div>

          {/* Notes section */}
          <div className="mt-8">
            <NotesEditor
              bookmarkId={bookmark.id}
              initialValue={bookmark.notes || ''}
              onSave={handleUpdateNotes}
              maxLength={10000}
              autoSaveDelay={1500}
            />
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <BookmarkModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdateBookmark}
        bookmark={bookmark}
      />
    </Layout>
  );
};

export default BookmarkDetailPage;
