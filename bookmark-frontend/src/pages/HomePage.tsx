import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import BookmarkModal from '../components/BookmarkModal';
import { bookmarkService } from '../services/bookmarkService';

const HomePage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  // Handle creating a new bookmark
  const handleCreateBookmark = async (data: any) => {
    try {
      await bookmarkService.createBookmark(data);
      setShowModal(false);
    } catch (error) {
      console.error('Error creating bookmark:', error);
      throw error;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Welcome to Planky
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          The simple and powerful bookmarking service for organizing your web.
        </p>

        {isAuthenticated ? (
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-3">
                Hello, {user?.username || user?.email || "visitor"}!
              </h2>
              <p className="text-gray-600 mb-4">
                Manage your bookmarks and stay organized with Planky.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/bookmarks" className="btn btn-primary">
                  View Bookmarks
                </Link>
                <button
                  onClick={() => setShowModal(true)}
                  className="btn btn-secondary cursor-pointer"
                >
                  Add New Bookmark
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
                <p className="text-gray-600 mb-3">
                  Access your pinned and favorite bookmarks.
                </p>
                <Link to="/bookmarks?filter=favorites" className="text-primary-600 font-medium hover:underline">
                  View Favorites
                </Link>
              </div>

              <div className="p-5 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Tags</h3>
                <p className="text-gray-600 mb-3">
                  Organize your bookmarks with tags.
                </p>
                <Link to="/tags" className="text-primary-600 font-medium hover:underline">
                  Manage Tags
                </Link>
              </div>

              <div className="p-5 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Account</h3>
                <p className="text-gray-600 mb-3">
                  Manage your account settings.
                </p>
                <Link to="/profile" className="text-primary-600 font-medium hover:underline">
                  View Profile
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-3">
                Get Started with Planky
              </h2>
              <p className="text-gray-600 mb-4">
                Sign up today to start organizing your favorite websites.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-5 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Save Bookmarks</h3>
                <p className="text-gray-600">
                  Save and organize your favorite websites in one place.
                </p>
              </div>

              <div className="p-5 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Tag & Categorize</h3>
                <p className="text-gray-600">
                  Use tags to categorize and easily find your bookmarks.
                </p>
              </div>

              <div className="p-5 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
                <p className="text-gray-600">
                  Pin and favorite bookmarks for quick access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bookmark Modal */}
        <BookmarkModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateBookmark}
        />
      </div>
    </Layout>
  );
};

export default HomePage;
