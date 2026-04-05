import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ZoomOAuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);
  const error = params.get('error');
  const code = params.get('code');

  useEffect(() => {
    if (error) return;

    const timer = setTimeout(() => {
      navigate(`/zoom/bridge${location.search}`, { replace: true });
    }, 700);

    return () => clearTimeout(timer);
  }, [error, location.search, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900 p-6 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white border border-red-200 rounded-xl p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-red-700">Zoom OAuth failed</h1>
          <p className="text-sm text-slate-700 mt-2">Zoom returned an OAuth error during callback.</p>
          <pre className="text-xs mt-3 bg-slate-50 border border-slate-200 rounded p-3 overflow-auto">
            {JSON.stringify({ error, query: Object.fromEntries(params.entries()) }, null, 2)}
          </pre>
          <button
            className="mt-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 text-sm"
            onClick={() => navigate('/zoom/bridge', { replace: true })}
          >
            Go to Zoom Bridge
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-6 flex items-center justify-center">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Completing Zoom OAuth</h1>
        <p className="text-sm text-slate-700 mt-2">
          Redirecting to bridge page with callback parameters.
        </p>
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <div><span className="font-medium">Code received:</span> {code ? 'yes' : 'no'}</div>
        </div>
      </div>
    </div>
  );
};

export default ZoomOAuthCallback;
