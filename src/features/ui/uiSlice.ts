import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark';

export interface UiState {
  sidebarOpen: boolean;
  theme: ThemeMode;
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: 'light',
};

/** Purely visual state. Nothing here survives a reload or reaches the API. */
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    toggleTheme(state) {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme, toggleTheme } = uiSlice.actions;

export const uiReducer = uiSlice.reducer;

type UiRootState = { ui: UiState };

export const selectSidebarOpen = (state: UiRootState): boolean => state.ui.sidebarOpen;
export const selectTheme = (state: UiRootState): ThemeMode => state.ui.theme;
