import React from 'react';

const UravinLoading = ({ size = 'md', text, fullScreen = false, className = '' }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-36 h-36',
    xl: 'w-48 h-48',
  };

  const videoElement = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative overflow-hidden rounded-2xl ${sizeClasses[size] || sizeClasses.md} flex items-center justify-center`}>
        <video
          src="/assets/uravin-logo-loading.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain pointer-events-none"
        />
      </div>
      {text && (
        <p className="mt-3 text-sm font-medium text-[#7A2E1E] animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FAF6F0]/90 backdrop-blur-sm">
        {videoElement}
      </div>
    );
  }

  return videoElement;
};

export default UravinLoading;
