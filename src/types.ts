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

export type Error = {
  id: string;
  status: string;
  message: string;
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
  volumes: Record<string, Volume | Error>;
  downloads: Record<string, Progress>;
};

export type Box = {
  videos: BoxEntry[];
  passed: BoxEntry[];
  failed: BoxEntry[];
};

export type Play = {
  databrary: Databrary;
  box: Box;
};
