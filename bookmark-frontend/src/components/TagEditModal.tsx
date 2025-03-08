import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Tag } from '../services/tagService';

interface TagEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: Tag | null;
  onSave: (tagId: number, name: string) => Promise<boolean>;
}

const TagEditModal: React.FC<TagEditModalProps> = ({
  isOpen,
  onClose,
  tag,
  onSave
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Update name when tag changes
  useEffect(() => {
    if (tag) {
      setName(tag.name);
    }
  }, [tag]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Tag name cannot be empty');
      return;
    }

    if (!tag) return;

    setIsSaving(true);
    setError(null);

    try {
      const success = await onSave(tag.id, trimmedName);
      if (success) {
        onClose();
      } else {
        setError('Failed to update tag. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.name || 'Failed to update tag. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={isSaving ? () => {} : onClose}>
        {/* Background overlay */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  Edit Tag
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                    disabled={isSaving}
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4">
                  {error && (
                    <div className="mb-4 p-2 bg-red-50 text-red-500 text-sm rounded">
                      {error}
                    </div>
                  )}

                  <div className="mb-4">
                    <label htmlFor="tag-name" className="block text-sm font-medium text-gray-700 mb-1">
                      Tag Name
                    </label>
                    <input
                      type="text"
                      id="tag-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input w-full"
                      disabled={isSaving}
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 flex items-center"
                      disabled={isSaving || !name.trim()}
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TagEditModal;
