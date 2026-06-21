import React from "react";

interface ErrorStateProps {
  message?: string;
  error?: any;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = "Failed to load prescription data. Please try again later.",
  error,
}) => {
  return (
    <div className="error-message p-4 text-red-500">
      <p>{message}</p>
      {error && process.env.NODE_ENV === "development" && (
        <details className="mt-2 text-xs">
          <summary>Error details (dev only)</summary>
          <pre className="mt-1 whitespace-pre-wrap">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
