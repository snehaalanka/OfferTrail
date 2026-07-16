import React from 'react';

const Loader = ({ size = 'md', color = 'default', text = '' }) => {
  // Map sizes to Tailwind classes
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  // Resolve color (default is dark olive, white is for buttons)
  const colorMap = {
    default: '#415b33',
    white: '#ffffff',
  };
  
  const spinnerColor = colorMap[color] || color;

  return (
    <div className={`flex flex-col items-center justify-center gap-3 animate-fade-in`}>
      <div 
        className={`${sizeClasses[size]} rounded-full animate-spin`}
        style={{
          borderColor: `${spinnerColor}30`, // 30% opacity for the track
          borderTopColor: spinnerColor,     // Solid color for the spinning head
        }}
      ></div>
      {text && (
        <span className={`font-light animate-pulse ${size === 'sm' ? 'text-[13px]' : 'text-[14.5px]'}`} style={{ color: spinnerColor === '#ffffff' ? '#ffffff' : '#64748b' }}>
          {text}
        </span>
      )}
    </div>
  );
};

export default Loader;
