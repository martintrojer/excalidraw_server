'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import LoadingSkeleton from './LoadingSkeleton';
import type { Drawing } from '@/lib/types';
import { DEBOUNCE_DELAY_MS, ITEMS_PER_PAGE } from '@/lib/constants';
import { formatDateTime } from '@/lib/utils';

interface DrawingsListProps {
  onSelectDrawing: (id: string) => void;
}

export default function DrawingsList({ onSelectDrawing }: DrawingsListProps) {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, DEBOUNCE_DELAY_MS);

  // Normalize search query to ensure stable dependency
  const normalizedSearchQuery = useMemo(() => debouncedSearchQuery.trim(), [debouncedSearchQuery]);

  // Reset to page 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearchQuery]);

  // Fetch drawings with pagination and search from server API
  useEffect(() => {
    async function fetchDrawings() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString(),
        });
        // Add search parameter if provided (server-side search)
        if (normalizedSearchQuery) {
          params.append('search', normalizedSearchQuery);
        }
        // Add cache-busting timestamp to ensure fresh data
        params.append('_t', Date.now().toString());

        const response = await fetch(`/api/drawings?${params.toString()}`, {
          cache: 'no-store', // Bypass browser cache to get fresh data
        });
        const result = await response.json();
        if (result.success) {
          setDrawings(result.drawings);
          setTotal(result.total);
          setTotalPages(result.totalPages);
          // Ensure currentPage matches server response
          if (result.page !== currentPage) {
            setCurrentPage(result.page);
          }
        }
      } catch (error) {
        console.error('Error fetching drawings:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchDrawings();
  }, [currentPage, normalizedSearchQuery]);

  // Refresh data when page becomes visible (e.g., user navigates back from editing)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refetch drawings when page becomes visible
        async function refreshDrawings() {
          try {
            const params = new URLSearchParams({
              page: currentPage.toString(),
              limit: ITEMS_PER_PAGE.toString(),
            });
            if (normalizedSearchQuery) {
              params.append('search', normalizedSearchQuery);
            }
            params.append('_t', Date.now().toString());

            const response = await fetch(`/api/drawings?${params.toString()}`, {
              cache: 'no-store',
            });
            const result = await response.json();
            if (result.success) {
              setDrawings(result.drawings);
              setTotal(result.total);
              setTotalPages(result.totalPages);
            }
          } catch (error) {
            console.error('Error refreshing drawings:', error);
          }
        }
        refreshDrawings();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentPage, normalizedSearchQuery]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        color: '#e0e0e0',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        <h1 style={{ margin: 0, color: '#e0e0e0', fontSize: '32px', fontWeight: '600' }}>
          My Drawings
        </h1>
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            maxWidth: '500px',
          }}
        >
          <input
            type="text"
            placeholder="Search drawings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '10px 16px',
              background: '#2d2d2d',
              color: '#e0e0e0',
              border: '1px solid #444',
              borderRadius: '6px',
              fontSize: '14px',
              width: '100%',
              maxWidth: '500px',
            }}
          />
        </div>
      </div>

      {debouncedSearchQuery && (
        <div
          style={{
            marginBottom: '20px',
            color: '#888',
            fontSize: '14px',
          }}
        >
          Found {total} drawing{total !== 1 ? 's' : ''} matching &quot;{debouncedSearchQuery}&quot;
        </div>
      )}

      {!loading && total === 0 && !debouncedSearchQuery ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: '#888',
          }}
        >
          No drawings yet. Create your first drawing!
        </div>
      ) : !loading && total === 0 && debouncedSearchQuery ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px',
            color: '#888',
          }}
        >
          No drawings found matching &quot;{searchQuery}&quot;
        </div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            {drawings.map((drawing) => (
              <div
                key={drawing.id}
                onClick={() => onSelectDrawing(drawing.id)}
                style={{
                  background: '#2d2d2d',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  padding: '20px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3
                  style={{
                    margin: '0 0 10px 0',
                    color: '#e0e0e0',
                    fontSize: '18px',
                  }}
                >
                  {drawing.title}
                </h3>
                <div
                  style={{
                    color: '#888',
                    fontSize: '12px',
                    marginBottom: '10px',
                  }}
                >
                  Created: {formatDateTime(drawing.created_at)}
                </div>
                <div
                  style={{
                    color: '#888',
                    fontSize: '12px',
                  }}
                >
                  Updated: {formatDateTime(drawing.updated_at)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '10px',
                marginTop: '30px',
                padding: '20px',
              }}
            >
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '8px 16px',
                  background: currentPage === 1 ? '#1a1a1a' : '#2d2d2d',
                  color: currentPage === 1 ? '#666' : '#e0e0e0',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                Previous
              </button>

              <div
                style={{
                  display: 'flex',
                  gap: '5px',
                  alignItems: 'center',
                }}
              >
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!showPage) {
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} style={{ color: '#888', padding: '0 5px' }}>
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '8px 12px',
                        background: page === currentPage ? '#4CAF50' : '#2d2d2d',
                        color: page === currentPage ? 'white' : '#e0e0e0',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        minWidth: '36px',
                      }}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '8px 16px',
                  background: currentPage === totalPages ? '#1a1a1a' : '#2d2d2d',
                  color: currentPage === totalPages ? '#666' : '#e0e0e0',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                Next
              </button>
            </div>
          )}

          <div
            style={{
              textAlign: 'center',
              color: '#888',
              fontSize: '14px',
              marginTop: '10px',
            }}
          >
            Showing {drawings.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}-
            {Math.min(currentPage * ITEMS_PER_PAGE, total)} of {total} drawing
            {total !== 1 ? 's' : ''}
          </div>
        </>
      )}
    </div>
  );
}
