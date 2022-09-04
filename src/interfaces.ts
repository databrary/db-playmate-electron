export interface IAsset {
  duration?: number;
  format?: number;
  id: number;
  name: string;
  permission: number;
  segment?: number[];
  size?: number;
}

export interface ICredentials {
  email: string;
  password: string;
  superuser: boolean;
}

export interface IContainerRecord {
  age?: number;
  id: number;
}

export interface IRecord {
  category: number;
  id: number;
  measures: Record<number, string>[];
}

export interface IContainer {
  assets: IAsset[];
  date: string;
  id: number;
  name: string;
  records: IContainerRecord[];
  release: number;
}

export interface IOwner {
  id: number;
  name: string;
}

export interface IVolume {
  access: any[];
  body: string;
  citation: any;
  comments: any[];
  containers: IContainer[];
  creation: string;
  doi: string;
  excerpts: any[];
  funding: any[];
  id: number;
  links: any[];
  metrics: number[];
  name: string;
  owners: IOwner[];
  permission: number;
  publicaccess: any;
  publicsharefull: any;
  records: IRecord[];
  state: any;
  tags: any[];
  top: any;
}
