import { configureStore } from '@reduxjs/toolkit';
import databraryReducer from '../slices/databrary';

export const store = configureStore({
  reducer: {
    databrary: databraryReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
