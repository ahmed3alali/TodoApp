'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMe } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    getMe()
      .then(() => router.replace('/todos'))
      .catch(() => router.replace('/login'));
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="spinner" />
      <p className="text-white/70 text-sm">Loading...</p>
    </div>
  );
}
