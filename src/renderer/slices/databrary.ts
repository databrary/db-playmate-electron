import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import { Databrary, Error, Progress, Volume } from '../../types';

const initialState: Databrary = {
  volumes: {},
  downloads: {},
};

export const databrarySlice = createSlice({
  name: 'databrary',
  initialState,
  reducers: {
    addVolumes: (
      state,
      action: PayloadAction<Record<string, Volume | Error>>
    ) => {
      state.volumes = action.payload;
    },
    addDownload: (state, action: PayloadAction<Progress>) => {
      const progress = action.payload;
      state.downloads[progress.id] = progress;
    },
  },
});

export const getVolume = createSelector(
  [
    (state: RootState) => state.databrary.volumes,
    (state: RootState, volumeId) => volumeId,
  ],
  (volumes, volumeId) => volumes[volumeId] as Volume | Error
);

export const getDownloadProgress = createSelector(
  [
    (state: RootState) => state.databrary.downloads,
    (state: RootState, assetId) => assetId,
  ],
  (downloads, assetId) => downloads[assetId] as Progress
);

export const { addVolumes, addDownload } = databrarySlice.actions;
export default databrarySlice.reducer;
