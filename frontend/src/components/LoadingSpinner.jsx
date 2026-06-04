import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ fullScreen = false, size = 'md', text = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-dark-950 flex flex-col items-center justify-center z-50">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-dark-700 animate-pulse" />
          <Loader2 className="w-8 h-8 text-primary-500 absolute inset-0 m-auto animate-spin" />
        </div>
        {text && <p className="mt-4 text-dark-400 text-sm">{text}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <Loader2 className={`${sizes[size]} text-primary-500 animate-spin`} />
      {text && <span className="text-dark-400 text-sm">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
