export type Asset = {
  assetId: number;
  assetName: string;
  sessionId: number;
  sessionName: string;
  volumeId?: string;
  percentage: number;
  path: string | undefined;
};

export type Participant = {
  recordId: number;
  id: string;
  gender: string;
  birthdate: string;
  language: string;
};

export type Context = {
  recordId: number;
  setting: string;
  language: string;
  country: string;
  state: string;
};
