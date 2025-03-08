import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Bookmark } from '../services/bookmarkService';
import { Tag, tagService } from '../services/tagService';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface BookmarkFormProps {
  initialData?: Partial<Bookmark>;
  onSubmit: (values: any) => Promise<void>;
  isSubmitting: boolean;
}

const BookmarkForm: React.FC<BookmarkFormProps> = ({
  initialData = {},
  onSubmit,
  isSubmitting,
}) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tagError, setTagError] = useState<string | null>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notesCharCount, setNotesCharCount] = useState(initialData?.notes?.length || 0);

  const formik = useFormik({
    initialValues: {
      url: initialData?.url || '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      notes: initialData?.notes || '',
      is_favorite: initialData?.is_favorite || false,
      is_pinned: initialData?.is_pinned || false,
    },
    validationSchema: Yup.object({
      url: Yup.string()
        .url('Please enter a valid URL')
        .required('URL is required'),
      title: Yup.string()
        .required('Title is required')
        .max(255, 'Title must be 255 characters or less'),
      description: Yup.string()
        .max(5000, 'Description must be 5000 characters or less'),
      notes: Yup.string()
        .max(10000, 'Notes must be 10000 characters or less'),
    }),
    onSubmit: async (values) => {
      // Get the current tag IDs and tag names
      const tagIds = selectedTags
        .filter(tag => tag.id !== undefined)
        .map(tag => tag.id!);

      const tagNames = selectedTags
        .filter(tag => tag.id === undefined)
        .map(tag => tag.name);

      try {
        await onSubmit({
          ...values,
          tag_ids: tagIds.length > 0 ? tagIds : undefined,
          tag_names: tagNames.length > 0 ? tagNames : undefined,
        });
      } catch (error) {
        console.error('Error submitting bookmark:', error);
        formik.setStatus('Failed to save bookmark. Please try again.');
      }
    },
  });

  // Update notes character count when notes change
  useEffect(() => {
    setNotesCharCount(formik.values.notes.length);
  }, [formik.values.notes]);

  // Set up selected tags state
  const [selectedTags, setSelectedTags] = useState<Tag[]>(
    initialData?.tags || []
  );

  // Fetch available tags
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await tagService.getTags();
        setAvailableTags(tags);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, []);

  // Function to fetch metadata from URL
  const fetchMetadata = async () => {
    const url = formik.values.url;

    if (!url || !Yup.string().url().isValidSync(url)) {
      return;
    }

    setFetchingMetadata(true);
    setFetchError(null);

    try {
      // Here, you would normally call an API endpoint to fetch metadata
      // For now, we'll simulate a request with a timeout
      // In a real implementation, you would call a server endpoint that uses
      // a library like metascraper or open-graph-scraper to fetch the metadata

      // Simulated API call for demo purposes
      setTimeout(() => {
        // This would actually be the result from your API
        const metadata = {
          title: 'Example Page Title',
          description: 'This is a sample description that would be extracted from the page metadata.',
          favicon: 'https://example.com/favicon.ico'
        };

        // Only set values if they're not already set by the user
        if (!formik.values.title) {
          formik.setFieldValue('title', metadata.title);
        }
        if (!formik.values.description) {
          formik.setFieldValue('description', metadata.description);
        }

        setFetchingMetadata(false);
      }, 1000);

    } catch (error) {
      console.error('Error fetching metadata:', error);
      setFetchError('Failed to fetch page metadata. Please enter details manually.');
      setFetchingMetadata(false);
    }
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    const tagName = tagInput.trim().toLowerCase();

    if (!tagName) {
      return;
    }

    // Check if tag already exists in selected tags
    if (selectedTags.some(tag => tag.name.toLowerCase() === tagName)) {
      setTagError('This tag is already added');
      return;
    }

    // Check if tag exists in available tags
    const existingTag = availableTags.find(tag =>
      tag.name.toLowerCase() === tagName
    );

    if (existingTag) {
      setSelectedTags([...selectedTags, existingTag]);
    } else {
      // Create a new tag (will be created on the server when form is submitted)
      setSelectedTags([...selectedTags, { id: undefined, name: tagName }]);
    }

    setTagInput('');
    setTagError(null);
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: Tag) => {
    setSelectedTags(selectedTags.filter(tag =>
      tag.id ? tag.id !== tagToRemove.id : tag.name !== tagToRemove.name
    ));
  };

  // Handle tag input keydown (add tag on Enter)
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-4">
      {formik.status && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md">
          {formik.status}
        </div>
      )}

      {/* URL Field */}
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
          URL <span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <input
            id="url"
            type="text"
            {...formik.getFieldProps('url')}
            onBlur={(e) => {
              formik.handleBlur(e);
              fetchMetadata();
            }}
            className={`input flex-grow ${
              formik.touched.url && formik.errors.url ? 'border-red-500' : ''
            }`}
            placeholder="https://example.com"
            disabled={isSubmitting || fetchingMetadata}
          />
          <button
            type="button"
            onClick={fetchMetadata}
            disabled={isSubmitting || fetchingMetadata || !formik.values.url}
            className="ml-2 px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {fetchingMetadata ? 'Fetching...' : 'Fetch'}
          </button>
        </div>
        {formik.touched.url && formik.errors.url ? (
          <div className="text-red-500 text-sm mt-1">{formik.errors.url}</div>
        ) : null}
        {fetchError && (
          <div className="text-red-500 text-sm mt-1">{fetchError}</div>
        )}
      </div>

      {/* Title Field */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          {...formik.getFieldProps('title')}
          className={`input w-full ${
            formik.touched.title && formik.errors.title ? 'border-red-500' : ''
          }`}
          placeholder="Bookmark title"
          disabled={isSubmitting || fetchingMetadata}
        />
        {formik.touched.title && formik.errors.title ? (
          <div className="text-red-500 text-sm mt-1">{formik.errors.title}</div>
        ) : null}
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          {...formik.getFieldProps('description')}
          rows={3}
          className={`input w-full ${
            formik.touched.description && formik.errors.description ? 'border-red-500' : ''
          }`}
          placeholder="Optional bookmark description"
          disabled={isSubmitting || fetchingMetadata}
        ></textarea>
        {formik.touched.description && formik.errors.description ? (
          <div className="text-red-500 text-sm mt-1">{formik.errors.description}</div>
        ) : null}
      </div>

      {/* Notes Field */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <span className="text-xs text-gray-500">
            {notesCharCount} / 10000 characters
          </span>
        </div>
        <textarea
          id="notes"
          {...formik.getFieldProps('notes')}
          rows={5}
          className={`input w-full font-mono ${
            formik.touched.notes && formik.errors.notes ? 'border-red-500' : ''
          }`}
          placeholder="Optional personal notes about this bookmark"
          disabled={isSubmitting}
        ></textarea>
        {formik.touched.notes && formik.errors.notes ? (
          <div className="text-red-500 text-sm mt-1">{formik.errors.notes}</div>
        ) : null}
        <div className="text-xs text-gray-500 mt-1">
          Notes are private and only visible to you. They support plain text formatting.
        </div>
      </div>

      {/* Tags Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tag, index) => (
            <div
              key={tag.id || `new-tag-${index}`}
              className="inline-flex items-center bg-primary-100 text-primary-800 rounded-full px-2.5 py-0.5 text-sm"
            >
              <span className="max-w-xs truncate">{tag.name}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-primary-700 hover:text-primary-900 focus:outline-none"
                aria-label={`Remove tag ${tag.name}`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
              setTagError(null);
            }}
            onKeyDown={handleTagKeyDown}
            placeholder="Add a tag"
            className="input flex-grow"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || isSubmitting}
            className="ml-2 px-3 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 flex items-center"
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>
        {tagError && (
          <div className="text-red-500 text-sm mt-1">{tagError}</div>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to add a tag or click the plus button
        </p>
      </div>

      {/* Favorite and Pin Options */}
      <div className="flex space-x-4">
        <div className="flex items-center">
          <input
            id="is_favorite"
            type="checkbox"
            {...formik.getFieldProps('is_favorite')}
            checked={formik.values.is_favorite}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="is_favorite" className="ml-2 block text-sm text-gray-700">
            Add to favorites
          </label>
        </div>

        <div className="flex items-center">
          <input
            id="is_pinned"
            type="checkbox"
            {...formik.getFieldProps('is_pinned')}
            checked={formik.values.is_pinned}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            disabled={isSubmitting}
          />
          <label htmlFor="is_pinned" className="ml-2 block text-sm text-gray-700">
            Pin bookmark
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting || fetchingMetadata || !formik.isValid}
          className="btn btn-primary px-6"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : initialData?.id ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default BookmarkForm;
