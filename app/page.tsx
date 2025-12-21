'use client';

import { useRouter } from 'next/navigation';
import DrawingsList from '../components/DrawingsList';
import HomeToolbar from '../components/HomeToolbar';
import ErrorBoundary from '../components/ErrorBoundary';

export default function HomePage() {
  const router = useRouter();

  return (
    <ErrorBoundary>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'var(--bg-primary)',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <DrawingsList
          onSelectDrawing={(id) => {
            router.push(`/drawing/${id}`);
          }}
        />
        <HomeToolbar onNew={() => router.push('/drawing/new')} onList={() => router.push('/')} />
      </div>
    </ErrorBoundary>
  );
}
