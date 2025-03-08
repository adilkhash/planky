import React, { useState } from 'react';
import { CheckIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CreateTagFormProps {
  onSubmit: (name: string) => Promise<boolean>;
}

const CreateTagForm: React.FC<CreateTagFormProps> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Tag name cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const success = await onSubmit(trimmedName);
      if (success) {
        setName('');
        setSuccessMessage(`Tag "${trimmedName}" created successfully`);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError('Failed to create tag. Please try again.');
      }
    } catch (err: any) {
      console.error('Error creating tag:', err);
      setError(err.response?.data?.name || 'Failed to create tag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-4 p-2 bg-red-50 text-red-500 text-sm rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-2 bg-green-50 text-green-600 text-sm rounded flex items-center">
          <CheckIcon className="h-4 w-4 mr-1" />
          {successMessage}
        </div>
      )}

      <div className="flex space-x-2">
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="Enter new tag name"
          className="input flex-grow"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          ) : (
            <>
              <PlusIcon className="h-5 w-5 mr-1" />
              Create Tag
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        Tags help you organize your bookmarks. Tag names are case-insensitive.
      </p>
    </form>
  );
};

export default CreateTagForm;
