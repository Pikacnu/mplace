import { useEffect, useState } from 'react';

export function Error({ children }: { children?: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  useEffect(() => {
    if (children) {
      setIsOpen(true);
    }
  }, [children]);
  return (
    <div className=' absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none'>
      {isOpen && (
        <div className='bg-red-500 text-white p-4 rounded'>{children}</div>
      )}
      <button
        onClick={() => setIsOpen(false)}
        className='absolute top-0 right-0 p-2'
      >
        x
      </button>
    </div>
  );
}
