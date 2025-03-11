import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Bookmark, bookmarkService } from '../services/bookmarkService';
import { Tag } from '../services/tagService';
import EnhancedTagInput from './EnhancedTagInput';

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
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [notesCharCount, setNotesCharCount] = useState(initialData?.notes?.length || 0);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialData?.tags || []);

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
        .filter(tag => tag.id !== undefined && tag.id > 0)
        .map(tag => tag.id!);

      const tagNames = selectedTags
        .filter(tag => tag.id === undefined || tag.id < 0)
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

  // Function to fetch metadata from URL
  const fetchMetadata = async () => {
    const url = formik.values.url;

    if (!url || !Yup.string().url().isValidSync(url)) {
      return;
    }

    setFetchingMetadata(true);
    setFetchError(null);

    try {
      const metadata = await bookmarkService.fetchUrlMetadata(url);

      if (metadata.error) {
        setFetchError(metadata.error);
        return;
      }

      let values = {...formik.values};

      if (!formik.values.title && metadata.title) {
        values = {...values, title: metadata.title}
        await formik.setValues(values);
      }
      if (!formik.values.description && metadata.description) {
        values= {...values, description: metadata.description}
        await formik.setValues(values);
      }

    } catch (error) {
      console.error('Error fetching metadata:', error);
      setFetchError('Failed to fetch page metadata. Please enter details manually.');
    } finally {
      setFetchingMetadata(false);
    }
  };

  // Handle tag changes
  const handleTagsChange = (newTags: Tag[]) => {
    setSelectedTags(newTags);
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
        <EnhancedTagInput
          selectedTags={selectedTags}
          onChange={handleTagsChange}
          disabled={isSubmitting}
        />
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
