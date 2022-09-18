import { Participant, Session } from 'types';

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

export const PLAY_SESSION_NAME_CHECKS = {
  VALID_SESSION_NAME: {
    error: 'Session name must be of PLAY_SITEID_PLAYID format',
    func: (session: Session) => session.name?.split('_').length === 3,
  },
  PLAY_IN_SESSIOM: {
    error: 'Session name does not contain PLAY',
    func: (session: Session, find = 'PLAY') => session.name?.includes(find),
  },
  SESSION_START_WITH_PLAY: {
    error: 'Session name does not start with PLAY',
    func: (session: Session, find = 'PLAY') => session.name?.startsWith(find),
  },
  HAS_PARTICIPANT: {
    error: 'No participant is assigned to this session',
    func: (session: Session) =>
      (Object.values(session.participants) || []).length,
  },
  HAS_ONE_PARTICIPANT: {
    error: 'No participant is assigned to this session',
    func: (session: Session) =>
      (Object.values(session?.participants) || []).length === 1,
  },
  HAS_PARTICIPANT_ID: {
    error: "Session's participant has no id",
    func: (session: Session) =>
      (Object.values(session?.participants) || []).length &&
      Object.values(session?.participants)[0].id.length,
  },
  HAS_SITE: {
    error: "No site found in this session's name",
    func: (session: Session) =>
      session.name?.split('_').length && !!session.name?.split('_')[1],
  },
  SITE_IS_VALID: {
    error: 'Site ID must be 5 letters length',
    func: (session: Session) =>
      session.name?.split('_').length &&
      !!session.name?.split('_')[1] &&
      session.name?.split('_')[1].length === 5,
  },
  PLAY_ID_IS_PARTICIPANT_ID: {
    error: 'Play ID and Particpant ID are different',
    func: (session: Session) =>
      session.name?.split('_').length > 2 &&
      session.name.split('_')[2] in session.participants,
  },
};

export const drawerWidth = 280;

export type QA = 'FAILED' | 'PASSED' | 'UNKNOWN';

export type DownloadProgress = `downloadProgress-${string}`;
type BoxUploadEvents =
  | 'uploadVideoStarted'
  | 'uploadVideoProgress'
  | 'uploadVideoDone'
  | 'uploadVideoError';

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
  | 'uploadFile'
  | 'uploadVideo'
  | BoxUploadEvents;
