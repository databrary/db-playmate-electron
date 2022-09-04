import { createSlice, createSelector } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store/store';
import { Databrary, Error, Volume } from '../../types';

const initialState: Databrary = {
  volumes: {},
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
  },
});

export const getVolume = createSelector(
  [
    (state: RootState) => state.databrary.volumes,
    (state: RootState, volumeId) => volumeId,
  ],
  (volumes, volumeId) => volumes[volumeId] as Volume | Error
);

export const { addVolumes } = databrarySlice.actions;
export default databrarySlice.reducer;
