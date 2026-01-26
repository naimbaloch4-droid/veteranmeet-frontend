'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function ApiTestPage() {
  const [results, setResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults: any = {};

    // Test 1: Check environment variable
    testResults.envVar = {
      name: 'Environment Variable',
      status: process.env.NEXT_PUBLIC_API_URL ? 'success' : 'error',
      value: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
      message: process.env.NEXT_PUBLIC_API_URL 
        ? 'Environment variable is configured' 
        : 'NEXT_PUBLIC_API_URL is not set'
    };

    // Test 2: Try to reach the backend
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/login/`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin
        }
      });
      
      testResults.backend = {
        name: 'Backend Reachability',
        status: 'success',
        message: `Backend is reachable (Status: ${response.status})`,
        cors: response.headers.get('Access-Control-Allow-Origin') || 'Not set'
      };
    } catch (error: any) {
      testResults.backend = {
        name: 'Backend Reachability',
        status: 'error',
        message: error.message,
        error: error.toString()
      };
    }

    // Test 3: Try admin overview endpoint
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1];
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/hub/admin-overview/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include'
      });

      const data = await response.json();
      
      testResults.adminEndpoint = {
        name: 'Admin Overview Endpoint',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Admin endpoint is accessible' : `Error: ${response.status} ${response.statusText}`,
        data: response.ok ? data : null,
        error: !response.ok ? data : null
      };
    } catch (error: any) {
      testResults.adminEndpoint = {
        name: 'Admin Overview Endpoint',
        status: 'error',
        message: error.message,
        error: error.toString()
      };
    }

    // Test 4: Check current origin
    testResults.origin = {
      name: 'Current Origin',
      status: 'info',
      value: window.location.origin,
      message: 'This origin must be allowed in Django CORS settings'
    };

    setResults(testResults);
    setTesting(false);
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'success') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API Connection Diagnostics</h1>
          <p className="text-gray-600 mb-6">
            Test the connection between your frontend and backend
          </p>

          <button
            onClick={runTests}
            disabled={testing}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
          >
            {testing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <span>Run Diagnostic Tests</span>
            )}
          </button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="space-y-4">
            {Object.values(results).map((result: any, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start space-x-4">
                  <StatusIcon status={result.status} />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {result.name}
                    </h3>
                    <p className="text-gray-700 mb-3">{result.message}</p>
                    
                    {result.value && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-2">
                        <p className="text-sm font-mono text-gray-800">{result.value}</p>
                      </div>
                    )}

                    {result.cors && (
                      <div className="mb-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">CORS Header:</span> {result.cors}
                        </p>
                      </div>
                    )}

                    {result.data && (
                      <details className="mt-3">
                        <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700">
                          View Response Data
                        </summary>
                        <pre className="mt-2 bg-gray-50 rounded-lg p-3 text-xs overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}

                    {result.error && (
                      <details className="mt-3">
                        <summary className="text-sm font-medium text-red-600 cursor-pointer hover:text-red-700">
                          View Error Details
                        </summary>
                        <pre className="mt-2 bg-red-50 rounded-lg p-3 text-xs overflow-x-auto text-red-800">
                          {typeof result.error === 'string' 
                            ? result.error 
                            : JSON.stringify(result.error, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">
            How to Fix CORS Issues
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>In your Django backend, update <code className="bg-blue-100 px-2 py-1 rounded">settings.py</code></li>
            <li>Add your Vercel domain to <code className="bg-blue-100 px-2 py-1 rounded">CORS_ALLOWED_ORIGINS</code></li>
            <li>Example: <code className="bg-blue-100 px-2 py-1 rounded">["https://your-app.vercel.app"]</code></li>
            <li>Ensure <code className="bg-blue-100 px-2 py-1 rounded">CORS_ALLOW_CREDENTIALS = True</code></li>
            <li>Redeploy your Django backend</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
