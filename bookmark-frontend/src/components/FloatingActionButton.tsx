import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon = <PlusIcon className="h-7 w-7" />,
  label = 'Add',
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-10">
      <button
        type="button"
        onClick={onClick}
        className="h-14 w-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center focus:outline-none hover:bg-primary-700 transition-colors"
        aria-label={label}
      >
        {icon}
      </button>
    </div>
  );
};

export default FloatingActionButton;
