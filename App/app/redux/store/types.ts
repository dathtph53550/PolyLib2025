import { store } from './store';

// Define types for TypeScript components
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 