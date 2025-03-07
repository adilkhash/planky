import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { bookmarkService, Bookmark, PaginatedResponse } from '../services/bookmarkService';
import { tagService, Tag } from '../services/tagService';
import { PlusIcon, TagIcon, StarIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const BookmarksPage: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginatedResponse<Bookmark> | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tagsData = await tagService.getTags({ include_count: true });
        setTags(tagsData);
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };

    fetchTags();
  }, []);

  useEffect(() => {
    const fetchBookmarks = async () => {
      setLoading(true);
      setError(null);

      try {
        let response;

        // Apply filters
        if (filter === 'favorites') {
          response = await bookmarkService.getFavoriteBookmarks();
        } else if (filter === 'pinned') {
          response = await bookmarkService.getPinnedBookmarks();
        } else if (selectedTag) {
          response = await bookmarkService.getBookmarksByTag(selectedTag);
        } else {
          // Default fetching with search if available
          const params: Record<string, any> = { page };

          if (searchQuery) {
            params.search = searchQuery;
          }

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

    fetchBookmarks();
  }, [page, filter, selectedTag, searchQuery]);

  const toggleFavorite = async (bookmark: Bookmark) => {
    try {
      const updatedBookmark = await bookmarkService.updateBookmark(bookmark.id, {
        is_favorite: !bookmark.is_favorite
      });

      // Update bookmarks list
      setBookmarks(bookmarks.map(b =>
        b.id === updatedBookmark.id ? updatedBookmark : b
      ));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold">Your Bookmarks</h1>

          <div className="w-full md:w-auto flex items-center gap-2">
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input flex-grow"
            />

            <Link to="/bookmarks/new" className="btn btn-primary flex items-center gap-1">
              <PlusIcon className="h-5 w-5" />
              <span>Add</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white rounded-lg shadow-md p-4">
            <h2 className="font-semibold text-lg mb-3">Filters</h2>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setFilter('all');
                  setSelectedTag(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-md ${
                  filter === 'all' && !selectedTag ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'
                }`}
              >
                All Bookmarks
              </button>

              <button
                onClick={() => {
                  setFilter('favorites');
                  setSelectedTag(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                  filter === 'favorites' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'
                }`}
              >
                <StarIcon className="h-5 w-5" />
                <span>Favorites</span>
              </button>

              <button
                onClick={() => {
                  setFilter('pinned');
                  setSelectedTag(null);
                }}
                className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                  filter === 'pinned' ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'
                }`}
              >
                <BookmarkIcon className="h-5 w-5" />
                <span>Pinned</span>
              </button>
            </div>

            <h2 className="font-semibold text-lg mt-6 mb-3">Tags</h2>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tags.length === 0 ? (
                <p className="text-gray-500 text-sm">No tags found</p>
              ) : (
                tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTag(tag.id);
                      setFilter('tag');
                    }}
                    className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
                      selectedTag === tag.id ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <TagIcon className="h-4 w-4" />
                    <span>{tag.name}</span>
                    {tag.bookmark_count !== undefined && (
                      <span className="ml-auto text-xs bg-gray-200 rounded-full px-2 py-1">
                        {tag.bookmark_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-grow">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-md">
                {error}
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <h3 className="text-xl font-medium mb-2">No bookmarks found</h3>
                <p className="text-gray-600 mb-6">
                  {selectedTag
                    ? "No bookmarks with this tag."
                    : filter === 'favorites'
                    ? "You don't have any favorite bookmarks yet."
                    : filter === 'pinned'
                    ? "You don't have any pinned bookmarks yet."
                    : "You don't have any bookmarks yet."}
                </p>
                <Link to="/bookmarks/new" className="btn btn-primary inline-flex items-center gap-1">
                  <PlusIcon className="h-5 w-5" />
                  <span>Add Bookmark</span>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <div key={bookmark.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start">
                      {bookmark.favicon_url ? (
                        <img
                          src={bookmark.favicon_url}
                          alt=""
                          className="w-6 h-6 mr-3 mt-1"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/32';
                          }}
                        />
                      ) : (
                        <BookmarkIcon className="w-6 h-6 mr-3 mt-1 text-gray-400" />
                      )}

                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <Link
                            to={`/bookmarks/${bookmark.id}`}
                            className="text-lg font-medium text-primary-700 hover:underline"
                          >
                            {bookmark.title}
                          </Link>

                          <button
                            onClick={() => toggleFavorite(bookmark)}
                            className="text-gray-400 hover:text-yellow-500"
                          >
                            {bookmark.is_favorite ? (
                              <StarIconSolid className="h-6 w-6 text-yellow-500" />
                            ) : (
                              <StarIcon className="h-6 w-6" />
                            )}
                          </button>
                        </div>

                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-gray-500 hover:underline truncate block"
                        >
                          {bookmark.url}
                        </a>

                        {bookmark.description && (
                          <p className="text-gray-700 mt-2">{bookmark.description}</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {bookmark.tags.map((tag) => (
                            <button
                              key={tag.id}
                              onClick={() => {
                                setSelectedTag(tag.id);
                                setFilter('tag');
                              }}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {pagination && (pagination.next || pagination.previous) && (
                  <div className="mt-6 flex justify-center">
                    <nav className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={!pagination.previous}
                        className={`px-3 py-1 rounded ${
                          pagination.previous
                            ? 'bg-white hover:bg-gray-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Previous
                      </button>

                      <span className="text-gray-700">
                        Page {page} of {Math.ceil(pagination.count / 10)}
                      </span>

                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.next}
                        className={`px-3 py-1 rounded ${
                          pagination.next
                            ? 'bg-white hover:bg-gray-100'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookmarksPage;
