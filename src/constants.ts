export const BOX_MAP = {
  PLAY_PROJECT_FOLDER_ID: '93875323133',
  UPLOAD_PASSED_VIDEO: '101782445650',
  QA_DATAVYU_TEMPLATE: '949804886008',
  QA_PASSED: '103319942062',
  QA_FAILED: '122812409466',
};

export const TOOLTIP_MESSAGES = {
  BOX_VIDEO_ALREADY_UPLOADED:
    'Video already exists in 1_PLAY_videos_for_coding folder',
  BOX_VIDEO_UPLOAD: 'Upload Video to BOX',
  DATABRARY_PARTICIPANT: 'Particpant #',
  DATABRARY_PARTICIPANT_ERROR: 'Found a participant but cannot retrieve the ID',
};

export const drawerWidth = 240;

export type QA = 'FAILED' | 'PASSED' | 'UNKNOWN';

export type DownloadProgress = `downloadProgress-${string}`;

export type Channels =
  | 'loadData'
  | 'status'
  | 'databrary'
  | 'downloadAssets'
  | DownloadProgress
  | 'databraryLogin'
  | 'isDatabraryConnected'
  | 'downloadOPF'
  | 'downloadedOPF'
  | 'uploadFiles'
  | 'uploadVideo'
  | 'uploadVideoStarted'
  | 'uploadVideoProgress'
  | 'uploadVideoDone';
