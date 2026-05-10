'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Tone, VideoLength } from '@/lib/types';
import { EMPTY_PIPELINE_STATE } from '@/lib/types';

const TONES: Tone[] = ['dramatic', 'educational', 'thriller', 'documentary'];
const LENGTHS: { value: VideoLength; label: string }[] = [
  { value: '5-8min', label: '5-8 min (~800 words)' },
  { value: '10-15min', label: '10-15 min (~1500 words)' },
  { value: '20min+', label: '20+ min (~3500 words)' },
];

export default function LandingPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<Tone>('dramatic');
  const [length, setLength] = useState<VideoLength>('10-15min');

  const handleStart = () => {
    if (!topic.trim()) return;
    const state = { ...EMPTY_PIPELINE_STATE, topic: topic.trim(), tone, length };
    sessionStorage.setItem('yt-pipeline-state', JSON.stringify(state));
    sessionStorage.setItem('yt-pipeline-index', '0');
    router.push('/pipeline');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black text-white tracking-tight">
            History Channel <span className="text-red-500">Pipeline</span>
          </h1>
          <p className="text-gray-400">Generate a full video package in 10 AI-powered steps</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Video Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="e.g. The Fall of the Roman Empire"
              className="w-full bg-gray-950 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-red-500 focus:outline-none placeholder-gray-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Channel Tone</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                    tone === t
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Video Length</label>
            <div className="space-y-2">
              {LENGTHS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setLength(value)}
                  className={`w-full py-2 px-4 rounded-lg text-sm text-left transition-colors ${
                    length === value
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!topic.trim()}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Pipeline
          </button>
        </div>

        <p className="text-center text-xs text-gray-600">
          Powered by Claude claude-sonnet-4-6 · Free DuckDuckGo research · ~$0.01-0.05 per run
        </p>
      </div>
    </main>
  );
}
