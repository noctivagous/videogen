'use client';

import { getStudioApp, type StudioAppId } from '@/lib/constants/studio-apps';
import { useNavigateToStudioPanel } from '@/hooks/use-studio-panel-navigation';

interface AppPlaceholderPanelProps {
  appId: StudioAppId;
}

export function AppPlaceholderPanel({ appId }: AppPlaceholderPanelProps) {
  const app = getStudioApp(appId);
  const navigateToPanel = useNavigateToStudioPanel();

  return (
    <div className="app-placeholder-panel flex flex-col items-center justify-center h-full min-h-0 p-8 text-center bg-surface-900">
      <div className="max-w-md space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-surface-800 border border-surface-600 flex items-center justify-center">
          <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-100">{app.title}</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">{app.description}</p>
        </div>
        <p className="text-xs uppercase tracking-widest font-semibold text-gray-500">Coming soon</p>
        <button
          type="button"
          onClick={() => navigateToPanel('shot-designer')}
          className="mt-2 px-4 py-2 text-xs font-medium rounded-lg border border-surface-600 bg-surface-800 hover:bg-surface-700 text-gray-300 transition-colors"
        >
          Back to Shot Designer
        </button>
      </div>
    </div>
  );
}
