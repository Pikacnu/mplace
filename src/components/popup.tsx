import { useEffect, useRef } from 'react';
import { type Position } from '../type';

export default function Popup({
  position,
  content,
  isOpen = false,
  onClose,
}: {
  position: Position;
  content: React.ReactNode;
  isOpen?: boolean;
  onClose: () => void;
}) {
  const currentElement = useRef<HTMLDivElement>(null);
  const isTriggered = useRef(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!isOpen) return;
      if (!isTriggered.current) {
        isTriggered.current = true;
        return;
      }
      const target = e.target as HTMLElement;
      if (isOpen && !currentElement.current?.contains(target)) {
        onClose();
      }
    };
    if (!isOpen) {
      isTriggered.current = false;
      return;
    }
    addEventListener('click', handleClickOutside);
    return () => {
      removeEventListener('click', handleClickOutside);
    };
  }, [onClose, isOpen]);

  return (
    <div
      className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-5 max-w-fit max-h-min text-sm rounded-2xl overflow-hidden'
      style={{
        left: position.x,
        top: position.y,
        display: isOpen ? 'block' : 'none',
      }}
      ref={currentElement}
    >
      <div className=' opacity-0 w-full h-full'></div>
      <div className='bg-white p-4 rounded shadow z-10'>{content}</div>
    </div>
  );
}
