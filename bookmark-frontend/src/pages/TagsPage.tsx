import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TagListItem from '../components/TagListItem';
import TagEditModal from '../components/TagEditModal';
import CreateTagForm from '../components/CreateTagForm';
import { Tag, tagService } from '../services/tagService';
import { ExclamationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const TagsPage: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'bookmark_count'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  const navigate = useNavigate();

  // Fetch tags
  const fetchTags = async () => {
    setLoading(true);
    setError(null);
    try {
      let tagData;
      if (showUnusedOnly) {
        tagData = await tagService.getUnusedTags();
      } else {
        tagData = await tagService.getTags({ include_count: true });
      }
      setTags(tagData);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
      setError('Failed to load tags. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, [showUnusedOnly]);

  // Handle creating a new tag
  const handleCreateTag = async (name: string) => {
    try {
      const newTag = await tagService.createTag({ name });
      setTags([...tags, newTag]);
      return true;
    } catch (error) {
      console.error('Error creating tag:', error);
      return false;
    }
  };

  // Handle editing a tag
  const handleEditClick = (tag: Tag) => {
    setEditingTag(tag);
    setShowEditModal(true);
  };

  // Handle updating a tag
  const handleUpdateTag = async (tagId: number, name: string) => {
    try {
      const updatedTag = await tagService.updateTag(tagId, { name });
      setTags(tags.map(tag => (tag.id === tagId ? updatedTag : tag)));
      setShowEditModal(false);
      setEditingTag(null);
      return true;
    } catch (error) {
      console.error('Error updating tag:', error);
      return false;
    }
  };

  // Handle deleting a tag
  const handleDeleteTag = async (tagId: number) => {
    if (window.confirm('Are you sure you want to delete this tag? It will be removed from all bookmarks.')) {
      try {
        await tagService.deleteTag(tagId);
        setTags(tags.filter(tag => tag.id !== tagId));
      } catch (error) {
        console.error('Error deleting tag:', error);
        setError('Failed to delete tag. Please try again.');
      }
    }
  };

  // Handle tag selection
  const handleTagSelection = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedTags.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedTags.length} tags? They will be removed from all bookmarks.`)) {
      try {
        await tagService.bulkDeleteTags(selectedTags);
        setTags(tags.filter(tag => !selectedTags.includes(tag.id)));
        setSelectedTags([]);
      } catch (error) {
        console.error('Error deleting tags:', error);
        setError('Failed to delete tags. Please try again.');
      }
    }
  };

  // Handle viewing bookmarks with tag
  const handleViewBookmarks = (tagId: number) => {
    navigate(`/tags/${tagId}/details/`);
  };

  // Sort tags
  const sortedTags = [...tags].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc'
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else {
      const countA = a.bookmark_count || 0;
      const countB = b.bookmark_count || 0;
      return sortDirection === 'asc'
        ? countA - countB
        : countB - countA;
    }
  });

  // Toggle sort
  const handleSortChange = (field: 'name' | 'bookmark_count') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Tags</h1>
          <div className="flex space-x-2">
            <button
              onClick={fetchTags}
              className="p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              title="Refresh tags"
            >
              <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Create tag form */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h2 className="text-lg font-medium mb-3">Create New Tag</h2>
          <CreateTagForm onSubmit={handleCreateTag} />
        </div>

        {/* Filters and sorting */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center space-x-4 mb-2 sm:mb-0">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="unused-filter"
                  checked={showUnusedOnly}
                  onChange={() => setShowUnusedOnly(!showUnusedOnly)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="unused-filter" className="ml-2 text-sm text-gray-700">
                  Show unused tags only
                </label>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => handleSortChange('name')}
                className={`text-sm px-3 py-1 rounded ${
                  sortBy === 'name' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'
                }`}
              >
                Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSortChange('bookmark_count')}
                className={`text-sm px-3 py-1 rounded ${
                  sortBy === 'bookmark_count' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100'
                }`}
              >
                Usage {sortBy === 'bookmark_count' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-800 p-4 rounded-md mb-4 flex items-start">
            <ExclamationCircleIcon className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}

        {/* Bulk actions */}
        {selectedTags.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4 flex justify-between items-center">
            <span className="text-blue-800">
              {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedTags([])}
                className="px-3 py-1 text-sm bg-white text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}

        {/* Tags list */}
        {loading && !tags.length ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tags...</p>
          </div>
        ) : !tags.length ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-xl font-medium mb-2">No Tags Found</h2>
            <p className="text-gray-600 mb-4">
              {showUnusedOnly
                ? "You don't have any unused tags."
                : "You haven't created any tags yet."}
            </p>
            {showUnusedOnly && (
              <button
                onClick={() => setShowUnusedOnly(false)}
                className="mt-2 text-primary-600 hover:text-primary-800"
              >
                Show all tags
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="border-b border-gray-200 px-4 py-3 flex items-center text-sm font-medium text-gray-500">
              <div className="w-8">
                <input
                  type="checkbox"
                  checked={selectedTags.length === tags.length}
                  onChange={() => {
                    if (selectedTags.length === tags.length) {
                      setSelectedTags([]);
                    } else {
                      setSelectedTags(tags.map(tag => tag.id));
                    }
                  }}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              <div className="flex-grow">Tag</div>
              <div className="w-24 text-center">Usage</div>
              <div className="w-24 text-center">Actions</div>
            </div>
            <ul className="divide-y divide-gray-200">
              {sortedTags.map(tag => (
                <TagListItem
                  key={tag.id}
                  tag={tag}
                  onEdit={() => handleEditClick(tag)}
                  onDelete={() => handleDeleteTag(tag.id)}
                  onViewBookmarks={() => handleViewBookmarks(tag.id)}
                  isSelected={selectedTags.includes(tag.id)}
                  onToggleSelect={() => handleTagSelection(tag.id)}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Tag edit modal */}
        <TagEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTag(null);
          }}
          tag={editingTag}
          onSave={handleUpdateTag}
        />
      </div>
    </Layout>
  );
};

export default TagsPage;
