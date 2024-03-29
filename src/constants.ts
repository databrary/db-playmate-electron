import { Session, Volume } from './types';

export const BOX_MAP = {
  VOLUMES: '1069201657029',
  PLAY_PROJECT_FOLDER_ID: '93875323133',
  UPLOAD_PASSED_VIDEO: '101782445650',
  QA_DATAVYU_TEMPLATE: '949804886008',
  QA_DATAVYU_TEMPLATE_EMO: '1018859541787',
  QA_DATAVYU_TEMPLATE_LOC: '1018862496372',
  QA_DATAVYU_TEMPLATE_OBJ: '1018859268695',
  QA_DATAVYU_TEMPLATE_TRA: '1018855042547',
  QA_PASSED: '103319942062',
  QA_FAILED: '122812409466',
  TRANSCRIBERS: '162848554261',
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

export const defaultVolume: Volume = {
  access: [],
  body: '',
  citation: undefined,
  comments: [],
  creation: '',
  doi: '',
  excerpts: [],
  funding: [],
  id: '',
  links: [],
  metrics: [],
  name: '',
  permission: 0,
  publicaccess: undefined,
  publicsharefull: undefined,
  state: undefined,
  tags: [],
  top: undefined,
  sessions: {},
  owners: [],
};
