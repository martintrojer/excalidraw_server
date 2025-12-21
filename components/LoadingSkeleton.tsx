'use client';

export default function LoadingSkeleton() {
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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '15px',
        }}
      >
        <div
          style={{
            width: '200px',
            height: '32px',
            background: '#2d2d2d',
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
        <div
          style={{
            width: '300px',
            height: '40px',
            background: '#2d2d2d',
            borderRadius: '4px',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: '#2d2d2d',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '20px',
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`,
            }}
          >
            <div
              style={{
                width: '80%',
                height: '24px',
                background: '#1a1a1a',
                borderRadius: '4px',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                width: '60%',
                height: '16px',
                background: '#1a1a1a',
                borderRadius: '4px',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                width: '50%',
                height: '16px',
                background: '#1a1a1a',
                borderRadius: '4px',
              }}
            />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
