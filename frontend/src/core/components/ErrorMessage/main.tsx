import type { ErrorMessageProps } from './types';

export const ErrorMessage = ({ title, message, onRetry, onBack }: ErrorMessageProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="mt-2 text-gray-600">{message}</p>
        <div className="mt-6 flex justify-center gap-4">
          {onRetry && (
            <button
              onClick={onRetry}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          )}
          {onBack && (
            <button
              onClick={onBack}
              className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
