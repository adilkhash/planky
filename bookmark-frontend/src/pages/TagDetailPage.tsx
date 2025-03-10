import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BookmarkItem from '../components/BookmarkItem';
import { TagDetail, tagService } from '../services/tagService';
import { Bookmark, bookmarkService, PaginatedResponse } from '../services/bookmarkService';
import { ArrowUturnLeftIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import TagEditModal from '../components/TagEditModal';

const TagDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tagDetail, setTagDetail] = useState<TagDetail | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Bookmark> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch tag details and its bookmarks
  useEffect(() => {
    const fetchTagDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const tagId = parseInt(id);

        // Fetch tag details
        const tagDetailData = await tagService.getTagDetail(tagId);
        setTagDetail(tagDetailData);

        // Fetch paginated bookmarks with this tag
        const response = await tagService.getTagBookmarks(tagId);
        setBookmarks(response.results);
        setPagination(response);
      } catch (err) {
        console.error('Error fetching tag details:', err);
        setError('Failed to load tag details. The tag may have been deleted or you do not have permission to view it.');
      } finally {
        setLoading(false);
      }
    };

    fetchTagDetails();
  }, [id, page]);

  // Handle editing a tag
  const handleUpdateTag = async (tagId: number, name: string) => {
    try {
      const updatedTag = await tagService.updateTag(tagId, { name });
      setTagDetail(prev => prev ? { ...prev, ...updatedTag } : null);
      setShowEditModal(false);
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      return false;
    }
  };

  // Handle deleting a tag
  const handleDeleteTag = async () => {
    if (!tagDetail) return;

    if (window.confirm(`Are you sure you want to delete the tag "${tagDetail.name}"? It will be removed from all bookmarks.`)) {
      setIsDeleting(true);
      try {
        await tagService.deleteTag(tagDetail.id);
        navigate('/tags', { replace: true });
      } catch (error) {
        console.error('Error deleting tag:', error);
        setError('Failed to delete tag. Please try again.');
        setIsDeleting(false);
      }
    }
  };

  // Handle bookmark operations
  const handleEditBookmark = (bookmark: Bookmark) => {
    navigate(`/bookmarks/${bookmark.id}`);
  };

  const handleDeleteBookmark = async (bookmarkId: number) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      try {
        await bookmarkService.deleteBookmark(bookmarkId);
        // Remove from local state for immediate feedback
        setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
      } catch (error) {
        console.error('Error deleting bookmark:', error);
        setError('Failed to delete bookmark. Please try again.');
      }
    }
  };

  const handleToggleFavorite = async (bookmark: Bookmark) => {
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
    }
  };

  const handleTogglePin = async (bookmark: Bookmark) => {
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
    }
  };

  if (loading && !tagDetail) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !tagDetail) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 text-red-800 p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error || 'Tag not found'}</p>
            <button
              onClick={() => navigate('/tags')}
              className="mt-4 inline-flex items-center text-red-700 hover:text-red-900"
            >
              <ArrowUturnLeftIcon className="h-5 w-5 mr-1" />
              Return to tags
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/tags')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowUturnLeftIcon className="h-5 w-5 mr-1" />
            Back to tags
          </button>
        </div>

        {/* Tag header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold flex items-center mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-lg font-medium bg-primary-100 text-primary-800 mr-2">
                  {tagDetail.name}
                </span>
                <span className="text-gray-600">
                  ({tagDetail.statistics.total_bookmarks} bookmark{tagDetail.statistics.total_bookmarks !== 1 ? 's' : ''})
                </span>
              </h1>
              <p className="text-gray-600">
                Created: {new Date(tagDetail.created_at).toLocaleDateString()}
                {tagDetail.is_ai_generated && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    AI Generated
                  </span>
                )}
              </p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="Edit tag"
              >
                <PencilIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
              </button>

              <button
                onClick={handleDeleteTag}
                disabled={isDeleting}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                aria-label="Delete tag"
              >
                {isDeleting ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-600"></div>
                ) : (
                  <TrashIcon className="h-6 w-6 text-gray-400 hover:text-red-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bookmarks list */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-medium mb-2">No Bookmarks</h2>
            <p className="text-gray-600 mb-4">
              This tag is not associated with any bookmarks.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {bookmarks.map((bookmark) => (
                <BookmarkItem
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={handleEditBookmark}
                  onDelete={handleDeleteBookmark}
                  onToggleFavorite={handleToggleFavorite}
                  onTogglePin={handleTogglePin}
                />
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

        {/* Tag edit modal */}
        {tagDetail && (
          <TagEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            tag={tagDetail}
            onSave={handleUpdateTag}
          />
        )}
      </div>
    </Layout>
  );
};

export default TagDetailPage;
