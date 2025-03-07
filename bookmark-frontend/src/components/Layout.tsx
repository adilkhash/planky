import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookmarkIcon,
  HomeIcon,
  TagIcon,
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
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
                <div className="relative group">
                  <button className="text-gray-600 hover:text-primary-600 flex items-center space-x-1">
                    <UserCircleIcon className="h-5 w-5" />
                    <span>{user?.username || user?.email}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
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
          <nav className="md:hidden border-t border-gray-200 py-2 px-4">
            <div className="flex flex-col space-y-3">
              {isAuthenticated ? (
                <>
                  <Link to="/" className="text-gray-600 hover:text-primary-600 flex items-center space-x-2">
                    <HomeIcon className="h-5 w-5" />
                    <span>Home</span>
                  </Link>
                  <Link to="/bookmarks" className="text-gray-600 hover:text-primary-600 flex items-center space-x-2">
                    <BookmarkIcon className="h-5 w-5" />
                    <span>Bookmarks</span>
                  </Link>
                  <Link to="/tags" className="text-gray-600 hover:text-primary-600 flex items-center space-x-2">
                    <TagIcon className="h-5 w-5" />
                    <span>Tags</span>
                  </Link>
                  <Link to="/profile" className="text-gray-600 hover:text-primary-600 flex items-center space-x-2">
                    <UserCircleIcon className="h-5 w-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-primary-600 flex items-center space-x-2"
                  >
                    <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 hover:text-primary-600">Login</Link>
                  <Link to="/register" className="text-gray-600 hover:text-primary-600">Register</Link>
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
      <footer className="bg-gray-100 py-4">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Planky. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;