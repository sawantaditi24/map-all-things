'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

function GoogleCallbackContent() {
  const searchParams = useSearchParams();
  const { loginWithGoogle } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          setError(`Google authentication failed: ${error}`);
          setStatus('error');
          return;
        }

        if (!code) {
          setError('No authorization code received from Google');
          setStatus('error');
          return;
        }

        // Call backend to handle Google OAuth callback
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl.replace(/\/$/, '')}/auth/google/callback?code=${encodeURIComponent(code)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Google authentication failed');
        }

        const data = await response.json();
        
        // Use the AuthContext to handle login
        loginWithGoogle(data.user, data.access_token);
        
        setStatus('success');
        
        // Notify parent window and close popup
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            user: data.user,
            token: data.access_token
          }, window.location.origin);
        }
        
        // Close popup after a short delay
        setTimeout(() => {
          window.close();
        }, 1000);
        
      } catch (err) {
        console.error('Google OAuth error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setStatus('error');
        
        // Notify parent window of error
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: err instanceof Error ? err.message : 'Authentication failed'
          }, window.location.origin);
        }
      }
    };

    handleGoogleCallback();
  }, [searchParams, loginWithGoogle]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Completing Google Sign-In
              </h2>
              <p className="text-gray-600">
                Please wait while we complete your authentication...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Successfully Signed In!
              </h2>
              <p className="text-gray-600">
                You can now close this window and return to the application.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {error}
              </p>
              <button
                onClick={() => window.close()}
                className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition duration-200"
              >
                Close Window
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h2>
            <p className="text-gray-600">
              Please wait while we process your request...
            </p>
          </div>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
