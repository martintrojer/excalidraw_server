'use client';

import { useRouter } from 'next/navigation';
import DrawingsList from '../components/DrawingsList';
import Toolbar from '../components/Toolbar';
import ErrorBoundary from '../components/ErrorBoundary';

export default function HomePage() {
  const router = useRouter();

  // Dummy handlers for toolbar on home page
  const handleSave = () => {
    // No-op on home page
  };

  const handleDelete = () => {
    // No-op on home page
  };

  return (
    <ErrorBoundary>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#1e1e1e',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        <DrawingsList
          onSelectDrawing={(id) => {
            router.push(`/drawing/${id}`);
          }}
        />
        <Toolbar
          drawingId={null}
          onSave={handleSave}
          onDelete={handleDelete}
          onNew={() => router.push('/drawing/new')}
          onList={() => router.push('/')}
        />
      </div>
    </ErrorBoundary>
  );
}
