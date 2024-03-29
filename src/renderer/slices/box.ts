import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import { Box, BoxEntry, Entity, QA, Study } from '../../types';

const initialState: Box = {
  videos: [],
  passed: [],
  failed: [],
  studyProgress: {
    TRA: [],
    LOC: [],
    EMO: [],
    OBJ: [],
  },
};

export const boxSlice = createSlice({
  name: 'box',
  initialState,
  reducers: {
    addVideos: (state, action: PayloadAction<BoxEntry[]>) => {
      state.videos = action.payload;
    },
    addPassed: (state, action: PayloadAction<BoxEntry[]>) => {
      state.passed = action.payload;
    },
    addFailed: (state, action: PayloadAction<BoxEntry[]>) => {
      state.failed = action.payload;
    },
    addStudyProgress: (
      state,
      action: PayloadAction<Partial<Record<Study, Entity[]>>>
    ) => {
      state.studyProgress = action.payload;
    },
  },
});

const isSessionIdInEntries = (entries: BoxEntry[], sessionId: string) => {
  return entries.some((entry) => entry.name.includes(sessionId));
};

export const getQAStatus = createSelector(
  [
    (state: RootState) => state.box,
    (state: RootState, sessionId: string) => sessionId,
  ],
  (box: Box, sessionId): QA => {
    if (isSessionIdInEntries(box.passed, sessionId)) return 'PASSED';
    if (isSessionIdInEntries(box.failed, sessionId)) return 'FAILED';
    return 'UNKNOWN';
  }
);

export const isVideoInBox = createSelector(
  [(state: RootState) => state.box, (state: RootState, sessionId) => sessionId],
  (box: Box, sessionId) => {
    return isSessionIdInEntries(box.videos, sessionId);
  }
);

export const { addVideos, addPassed, addFailed, addStudyProgress } =
  boxSlice.actions;
export default boxSlice.reducer;
