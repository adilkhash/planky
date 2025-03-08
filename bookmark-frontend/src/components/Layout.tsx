import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProfileDropdown from './ProfileDropdown';
import {
  BookmarkIcon,
  HomeIcon,
  TagIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <BookmarkIcon className="h-8 w-8 text-primary-600" />
            <Link to="/" className="text-xl font-bold text-gray-900">Planky</Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/" className="text-gray-600 hover:text-primary-600 flex items-center space-x-1">
                  <HomeIcon className="h-5 w-5" />
                  <span>Home</span>
                </Link>
                <Link to="/bookmarks" className="text-gray-600 hover:text-primary-600 flex items-center space-x-1">
                  <BookmarkIcon className="h-5 w-5" />
                  <span>Bookmarks</span>
                </Link>
                <Link to="/tags" className="text-gray-600 hover:text-primary-600 flex items-center space-x-1">
                  <TagIcon className="h-5 w-5" />
                  <span>Tags</span>
                </Link>
                <ProfileDropdown />
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-primary-600">Login</Link>
                <Link to="/register" className="btn btn-primary">Register</Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden border-t border-gray-200 py-2 px-4 bg-white shadow-lg">
            <div className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/"
                    className="text-gray-600 hover:text-primary-600 flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <HomeIcon className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                  <Link
                    to="/bookmarks"
                    className="text-gray-600 hover:text-primary-600 flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <BookmarkIcon className="h-5 w-5" />
                    <span>Bookmarks</span>
                  </Link>
                  <Link
                    to="/tags"
                    className="text-gray-600 hover:text-primary-600 flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <TagIcon className="h-5 w-5" />
                    <span>Tags</span>
                  </Link>
                  <div className="border-t border-gray-200 my-2 pt-2">
                    <ProfileDropdown />
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-primary-600 p-2 rounded-md hover:bg-gray-100"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="bg-primary-600 text-white p-2 rounded-md hover:bg-primary-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 mt-8 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Planky. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
