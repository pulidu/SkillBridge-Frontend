import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from './api';
import { authReducer } from '@/features/auth/authSlice';
import { coursesReducer } from '@/features/courses/coursesSlice';
import { uiReducer } from '@/features/ui/uiSlice';

/**
 * Composition root for client state.
 *
 * Server state lives in the RTK Query cache under `api`. Plain slices are
 * reserved for state that genuinely belongs to the client: the session, the
 * active course filters and visual preferences.
 */
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    courses: coursesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  devTools: import.meta.env.MODE !== 'production',
});

/** Enables `refetchOnFocus` / `refetchOnReconnect` behaviours. */
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
