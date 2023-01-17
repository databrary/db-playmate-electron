import { ParsedPath } from 'path';
import { OPF } from './OPF';

export type Session = {
  date: string;
  id: string;
  name: string;
  participants: Record<string, Participant>;
  assets: Record<string, Asset>;
  contexts: Record<string, Context>;
  release: number;
};

export type Volume = {
  access: any[];
  body: string;
  citation: any;
  comments: any[];
  creation: string;
  doi: string;
  excerpts: any[];
  funding: any[];
  id: string;
  links: any[];
  metrics: number[];
  name: string;
  permission: number;
  publicaccess: any;
  publicsharefull: any;
  state: any;
  tags: any[];
  top: any;
  sessions: Record<string, Session>;
  owners: Owner[];
};

export type Owner = {
  id: number;
  name: string;
};

export type Asset = {
  assetId: string;
  assetName: string;
  sessionId: string;
  sessionName: string;
  volumeId: string;
};

export type Participant = {
  recordId: string;
  id: string;
  gender: string;
  birthdate: string;
  language: string;
};

export type Context = {
  recordId: string;
  setting: string;
  language: string;
  country: string;
  state: string;
};

export type BoxEntry = {
  id: number;
  etag: number;
  type: string;
  sequence_id: number;
  name: string;
  sha1: string;
  file_version: {
    id: number;
    type: string;
    sha1: string;
  };
};

export type EntityProgress = {
  folderId: string | undefined;
  volumes: BoxEntry[];
};

// Could be a person or an institution
export type Entity = {
  type: Study;
  name: string;
  folderId: string;
  toDo: EntityProgress;
  inProgress: EntityProgress;
  done: EntityProgress;
};

export type Status = 'STARTED' | 'PROGRESS' | 'ERRORED' | 'DONE' | undefined;

export type Progress = {
  id: string;
  status: Status;
  percentage: number;
  message: string | undefined;
  path: string | undefined;
  name: string | undefined;
};

export type Databrary = {
  volumes: Record<string, Volume>;
  downloads: Record<string, Progress>;
};

export type Box = {
  videos: BoxEntry[];
  passed: BoxEntry[];
  failed: BoxEntry[];
  studyProgress: Partial<Record<Study, Entity[]>>;
};

export type Play = {
  databrary: Databrary;
  box: Box;
};

export type StudyBuildFunction = (qaOPF: OPF, template: OPF) => OPF;
export type StudyDownloadFunction = (fileId?: string) => Promise<Buffer>;
export type StudyFilePathFunction = (filePath: ParsedPath) => string;
export type StudyFileNameFunction = (name: string, ext?: string) => string;

export type QA = 'FAILED' | 'PASSED' | 'UNKNOWN';
export type Study = 'EMO' | 'TRA' | 'OBJ' | 'LOC';
export type StudyStatus = 'DONE' | 'INPROGRESS' | 'TODO';
export type StudyKeys =
  | 'build'
  | 'download'
  | 'resolveFilePath'
  | 'buildFileName';
export type StudyFunctions = { build: StudyBuildFunction } & {
  download: StudyDownloadFunction;
} & { resolveFilePath: StudyFilePathFunction } & {
  buildFileName: StudyFileNameFunction;
};

export type DownloadProgress = `downloadProgress-${string}`;
type BoxUploadEvents =
  | 'uploadVideoStarted'
  | 'uploadVideoProgress'
  | 'uploadVideoDone'
  | 'uploadVideoError';

// TODO: CLEAN ME!!!
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
  | BoxUploadEvents
  | 'openExternal'
  | 'assign';
