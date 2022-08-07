export type Asset = {
  assetId: number;
  assetName: string;
  sessionId: number;
  sessionName: string;
  volumeId?: string;
  percentage: number | undefined;
  path: string | undefined;
};

export type Participant = {
  recordId: number;
  id: string;
  gender: string;
};
