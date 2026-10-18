import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { store } from '@/app/store';
import { bootstrapSession, sessionCleared } from '@/features/auth/authSlice';
import { onSessionExpired } from '@/services/apiClient';
import { AppRoutes } from '@/routes/AppRoutes';

/**
 * Application entry point. The session bootstrap is dispatched once here so
 * every route, including the public ones, renders against a known auth state.
 */
export default function App() {
  useEffect(() => {
    // When a refresh can no longer be recovered, drop the client session so
    // `ProtectedRoute` redirects to the existing login flow instead of leaving
    // the user on a dead authenticated screen.
    onSessionExpired(() => {
      store.dispatch(sessionCleared());
    });

    void store.dispatch(bootstrapSession());
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
