import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import FilterControls from '../components/FilterControls';
import BookmarkList from '../components/BookmarkList';
import { MagnifyingGlassIcon, FunnelIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { bookmarkService, Bookmark, PaginatedResponse } from '../services/bookmarkService';
import { tagService, Tag } from '../services/tagService';

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extract query params
  const query = searchParams.get('q') || '';
  const tagIds = searchParams.get('tags')?.split(',').map(Number) || [];
  const favorite = searchParams.get('favorite') === 'true' ? true : null;
  const pinned = searchParams.get('pinned') === 'true' ? true : null;

  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Bookmark[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<Bookmark> | null>(null);
  const [page, setPage] = useState(1);
  const [tags, setTags] = useState<Tag[]>([]);

  // Get tag names for display
  useEffect(() => {
    const fetchTags = async () => {
      if (tagIds.length === 0) return;

      try {
        const allTags = await tagService.getTags();
        const filteredTags = allTags.filter(tag => tagIds.includes(tag.id));
        setTags(filteredTags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, [tagIds]);

  // Fetch search results
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, any> = { page };

        // Add search query
        if (query) {
          params.search = query;
        }

        // Add tag filters
        if (tagIds.length > 0) {
          params.tags = tagIds.join(',');
        }

        // Add favorite/pinned filters
        if (favorite === true) {
          params.is_favorite = true;
        }

        if (pinned === true) {
          params.is_pinned = true;
        }

        const response = await bookmarkService.getBookmarks(params);
        setResults(response.results);
        setPagination(response);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Failed to load search results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, tagIds, favorite, pinned, page]);

  // Handle search submit
  const handleSearch = (newQuery: string) => {
    // Create new params preserving filters
    const newParams = new URLSearchParams();

    if (newQuery) {
      newParams.set('q', newQuery);
    }

    if (tagIds.length > 0) {
      newParams.set('tags', tagIds.join(','));
    }

    if (favorite === true) {
      newParams.set('favorite', 'true');
    }

    if (pinned === true) {
      newParams.set('pinned', 'true');
    }

    // Reset to page 1
    setPage(1);

    // Update URL
    setSearchParams(newParams);
  };

  // Handle filter changes
  const handleFilterChange = (filters: { tags: number[]; favorite: boolean | null; pinned: boolean | null }) => {
    // Create new params preserving search query
    const newParams = new URLSearchParams();

    if (query) {
      newParams.set('q', query);
    }

    if (filters.tags.length > 0) {
      newParams.set('tags', filters.tags.join(','));
    }

    if (filters.favorite === true) {
      newParams.set('favorite', 'true');
    }

    if (filters.pinned === true) {
      newParams.set('pinned', 'true');
    }

    // Reset to page 1
    setPage(1);

    // Update URL
    setSearchParams(newParams);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Generate page title
  const getPageTitle = () => {
    const parts = [];

    if (query) {
      parts.push(`"${query}"`);
    }

    if (favorite === true) {
      parts.push('Favorites');
    }

    if (pinned === true) {
      parts.push('Pinned');
    }

    if (tags.length > 0) {
      parts.push(`Tags: ${tags.map(tag => tag.name).join(', ')}`);
    }

    if (parts.length === 0) {
      return 'All Bookmarks';
    }

    return `Search Results: ${parts.join(' • ')}`;
  };

  // Check if any filters are applied
  const hasFilters = query || tagIds.length > 0 || favorite === true || pinned === true;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Search and filter header */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="mb-4">
            <SearchBar
              initialQuery={query}
              onSearch={handleSearch}
              placeholder="Search in titles, descriptions, URLs, and notes..."
              autoFocus={!query}
              className="max-w-3xl mx-auto"
            />
          </div>

          <div className="mt-4">
            <FilterControls
              initialFilters={{
                tags: tagIds,
                favorite,
                pinned
              }}
              onFilterChange={handleFilterChange}
            />
          </div>
        </div>

        {/* Results header */}
        <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-xl font-semibold flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              {getPageTitle()}

              {pagination && (
                <span className="ml-2 text-sm text-gray-500">
                  ({pagination.count} results)
                </span>
              )}
            </h1>
          </div>

          <div>
            <button
              onClick={() => navigate('/bookmarks')}
              className="inline-flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowUturnLeftIcon className="h-5 w-5 mr-1" />
              <span>Back to all bookmarks</span>
            </button>
          </div>
        </div>

        {/* Results list */}
        {loading && !results.length ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-800 p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-2">Error</h2>
            <p>{error}</p>
          </div>
        ) : !hasFilters ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FunnelIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium mb-2">Start Searching</h2>
            <p className="text-gray-600 mb-4">
              Enter a search term or apply filters to find your bookmarks.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-medium mb-2">No results found</h2>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map(bookmark => (
              <div key={bookmark.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                <a
                  href={`/bookmarks/${bookmark.id}`}
                  className="block"
                >
                  <h3 className="text-lg font-medium text-primary-700 mb-1 hover:underline">
                    {bookmark.title}
                  </h3>

                  <p className="text-sm text-gray-500 mb-2 truncate">
                    {bookmark.url}
                  </p>

                  {bookmark.description && (
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {bookmark.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {bookmark.tags && bookmark.tags.map(tag => (
                      <span
                        key={tag.id}
                        className="inline-block px-2 py-0.5 bg-primary-100 text-primary-800 text-xs rounded-full"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && (pagination.next || pagination.previous) && (
          <div className="mt-6 flex justify-center">
            <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => handlePageChange(page - 1)}
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
                onClick={() => handlePageChange(page + 1)}
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
      </div>
    </Layout>
  );
};

export default SearchResultsPage;
