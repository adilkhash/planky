import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import debounce from 'lodash/debounce';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface NotesEditorProps {
  bookmarkId: number;
  initialValue: string;
  onSave: (bookmarkId: number, notes: string) => Promise<void>;
  maxLength?: number;
  autoSaveDelay?: number; // Delay in milliseconds
}

const NotesEditor: React.FC<NotesEditorProps> = ({
  bookmarkId,
  initialValue = '',
  onSave,
  maxLength = 10000,
  autoSaveDelay = 2000, // 2 seconds default
}) => {
  const [notes, setNotes] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [characterCount, setCharacterCount] = useState(initialValue.length);
  const [isEditing, setIsEditing] = useState(false);

  // Create a debounced save function that will be re-created when onSave changes
  const debouncedSaveRef = useRef<any>(null);

  useEffect(() => {
    debouncedSaveRef.current = debounce(async (notes: string) => {
      if (notes !== initialValue) {
        try {
          setSaveStatus('saving');
          await onSave(bookmarkId, notes);
          setSaveStatus('saved');
          // Reset to idle after a delay
          setTimeout(() => {
            setSaveStatus('idle');
          }, 3000);
        } catch (error) {
          console.error('Error saving notes:', error);
          setSaveStatus('error');
        }
      }
    }, autoSaveDelay);

    return () => {
      // Cancel any pending debounced calls on cleanup
      if (debouncedSaveRef.current) {
        debouncedSaveRef.current.cancel();
      }
    };
  }, [bookmarkId, initialValue, onSave, autoSaveDelay]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;

    // Check if the input exceeds max length
    if (value.length <= maxLength) {
      setNotes(value);
      setCharacterCount(value.length);

      // Trigger auto-save
      if (debouncedSaveRef.current) {
        setSaveStatus('saving');
        debouncedSaveRef.current(value);
      }
    }
  };

  // Handle manual save
  const handleSave = async () => {
    if (notes === initialValue) return;

    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await onSave(bookmarkId, notes);
      setSaveStatus('saved');
      // Exit editing mode
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving notes:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Get sanitized HTML from notes (for preview)
  const getSanitizedHtml = () => {
    return {
      __html: DOMPurify.sanitize(notes.replace(/\n/g, '<br />'))
    };
  };

  // Status indicator component
  const StatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <span className="text-gray-600 text-sm flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary-600 mr-2"></div>
            Saving...
          </span>
        );
      case 'saved':
        return (
          <span className="text-green-600 text-sm flex items-center">
            <CheckIcon className="h-4 w-4 mr-1" />
            Saved
          </span>
        );
      case 'error':
        return (
          <span className="text-red-600 text-sm flex items-center">
            <XMarkIcon className="h-4 w-4 mr-1" />
            Error saving
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="notes-editor bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-900">Notes</h3>
        <div className="flex items-center space-x-3">
          <StatusIndicator />

          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-md text-sm"
            >
              Edit Notes
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <>
          <div className="mb-1">
            <textarea
              value={notes}
              onChange={handleChange}
              className="input w-full h-40 resize-y font-mono"
              placeholder="Add your notes here..."
              aria-label="Bookmark notes"
              disabled={isSaving}
            ></textarea>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {characterCount} / {maxLength} characters
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setNotes(initialValue);
                  setCharacterCount(initialValue.length);
                  setIsEditing(false);
                  setSaveStatus('idle');
                }}
                className="px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-md text-sm"
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-3 py-1 bg-primary-600 text-white hover:bg-primary-700 rounded-md text-sm"
                disabled={isSaving || notes === initialValue}
              >
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <div
          className={`prose max-w-none min-h-[100px] p-3 border rounded-md ${notes ? 'bg-gray-50' : 'bg-gray-50 text-gray-400 italic'}`}
        >
          {notes ? (
            <div dangerouslySetInnerHTML={getSanitizedHtml()} />
          ) : (
            <p>No notes added yet. Click "Edit Notes" to add some.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default NotesEditor;
