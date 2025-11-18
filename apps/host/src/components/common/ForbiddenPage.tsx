import { useAuth } from '../../core/auth/AuthContext';

const ForbiddenPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
      <h2 style={{ marginBottom: '1rem' }}>Access Denied</h2>
      <p style={{ color: 'var(--color-text)', opacity: 0.7, marginBottom: '2rem' }}>
        {isAuthenticated
          ? 'You do not have permission to access this area.'
          : 'Please log in to access this area.'}
      </p>
      {!isAuthenticated && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <p style={{ color: 'var(--color-text)', opacity: 0.7 }}>
            Use the login buttons in the header to continue.
          </p>
        </div>
      )}
    </section>
  );
};

export default ForbiddenPage;

