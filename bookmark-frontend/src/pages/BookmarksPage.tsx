import React, { useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BookmarkList from '../components/BookmarkList';
import BookmarkModal from '../components/BookmarkModal';
import FloatingActionButton from '../components/FloatingActionButton';
import { bookmarkService } from '../services/bookmarkService';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const BookmarksPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const location = useLocation();

  // Determine which filter to apply
  const filter = searchParams.get('filter') || '';
  const tagId = searchParams.get('tag_id') ? parseInt(searchParams.get('tag_id')!) : null;

  // Determine title based on filter
  let pageTitle = 'Bookmarks';
  if (filter === 'favorites') pageTitle = 'Favorite Bookmarks';
  if (filter === 'pinned') pageTitle = 'Pinned Bookmarks';
  if (tagId) pageTitle = 'Tagged Bookmarks';
  if (searchQuery) pageTitle = `Search Results: ${searchQuery}`;

  // Handle creating a new bookmark
  const handleCreateBookmark = async (data: any) => {
    try {
      await bookmarkService.createBookmark(data);
      // Modal will be closed by BookmarkModal component
      // BookmarkList will refresh on its own
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error; // Re-throw to let BookmarkModal handle it
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(location.search);

    if (searchQuery) {
      currentParams.set('search', searchQuery);
    } else {
      currentParams.delete('search');
    }

    // We would navigate programmatically here, but for this example
    // we'll just rely on the searchQuery state being passed to BookmarkList
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input pl-10 w-full"
                  placeholder="Search bookmarks..."
                />
              </div>
              <button
                type="submit"
                className="ml-3 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Bookmark list */}
        <BookmarkList
          tagFilter={tagId}
          searchQuery={searchQuery}
          onlyFavorites={filter === 'favorites'}
          onlyPinned={filter === 'pinned'}
        />

        {/* Bookmark creation modal */}
        <BookmarkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateBookmark}
        />

        {/* Floating action button (visible on mobile) */}
        <FloatingActionButton
          onClick={() => setShowModal(true)}
          label="Add new bookmark"
        />
      </div>
    </Layout>
  );
};

export default BookmarksPage;
