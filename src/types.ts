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
  percentage: number;
  path: string | undefined;
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

export type Databrary = {
  volumes: Record<string, Volume | Error>;
};

export type Play = {
  databrary: Databrary;
};
