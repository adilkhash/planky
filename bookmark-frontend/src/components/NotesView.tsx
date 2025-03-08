import React from 'react';
import DOMPurify from 'dompurify';
import { PencilIcon } from '@heroicons/react/24/outline';

interface NotesViewProps {
  notes: string | null;
  onEditClick?: () => void;
  className?: string;
}

const NotesView: React.FC<NotesViewProps> = ({
  notes,
  onEditClick,
  className = '',
}) => {
  // If there are no notes, show a message
  if (!notes) {
    return (
      <div className={`text-gray-400 italic p-3 ${className}`}>
        No notes available.
        {onEditClick && (
          <button
            onClick={onEditClick}
            className="ml-2 text-primary-600 hover:text-primary-800"
          >
            Add notes
          </button>
        )}
      </div>
    );
  }

  // Sanitize and format notes for display (convert newlines to <br>)
  const sanitizedNotes = {
    __html: DOMPurify.sanitize(notes.replace(/\n/g, '<br />'))
  };

  return (
    <div className={`notes-view ${className}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">Notes</h3>
        {onEditClick && (
          <button
            onClick={onEditClick}
            className="p-1 text-gray-500 hover:text-primary-600"
            aria-label="Edit notes"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div
        className="prose prose-sm max-w-none bg-gray-50 p-3 rounded border"
        dangerouslySetInnerHTML={sanitizedNotes}
      />
    </div>
  );
};

export default NotesView;
