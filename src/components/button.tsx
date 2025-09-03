export function Button({
  children,
  onClick,
  onMouseEnter = () => {},
  onMouseLeave = () => {},
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`bg-blue-500 text-white p-2 rounded hover:bg-blue-600 hover:p-4 transition-all duration-200 ${className}`}
    >
      {children}
    </button>
  );
}
