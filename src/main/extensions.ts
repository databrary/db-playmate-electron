/* eslint import/prefer-default-export: off, import/no-mutable-exports: off */
import { URL } from 'url';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { Context, Error, Volume, Session, Participant, Asset } from '../types';
import { IContainer, IRecord, IVolume } from '../interfaces';

export let resolveHtmlPath: (htmlFileName: string) => string;

export const installExtensions = async () => {
  // eslint-disable-next-line global-require
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

export const isDebugMode = () => {
  return (
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
  );
};
export class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT || 1212;
  resolveHtmlPath = (htmlFileName: string) => {
    const url = new URL(`http://localhost:${port}`);
    url.pathname = htmlFileName;
    return url.href;
  };
} else {
  resolveHtmlPath = (htmlFileName: string) => {
    return `file://${path.resolve(__dirname, '../renderer/', htmlFileName)}`;
  };
}

const getContexts = (recordList: IRecord[]): Context[] => {
  return recordList
    .filter((record) => record.category === 7)
    .map((obj) => {
      return {
        recordId: `${obj.id}`,
        setting: obj.measures[33],
        language: obj.measures[34],
        country: obj.measures[35],
        state: obj.measures[36],
      } as Context;
    });
};

const getParticipants = (recordList: IRecord[]): Participant[] => {
  return recordList
    .filter((record) => record.category === 1)
    .map((obj) => {
      return {
        recordId: `${obj.id}`,
        id: obj.measures[1],
        gender: obj.measures[5],
        birthdate: obj.measures[4],
        language: obj.measures[12],
      } as Participant;
    });
};

const getParticipantByRecord = (
  particpantList: Participant[],
  recordId: string
): Participant => {
  return particpantList.filter(
    (participant) => participant.recordId === recordId
  )[0];
};

const getContextByRecord = (
  contextList: Context[],
  recordId: string
): Context[] => {
  return contextList.filter((context) => context.recordId === recordId);
};

const getSessionContext = (
  container: IContainer,
  contexts: Context[]
): Record<string, Context> => {
  // const containerRecordList = (volumeInfo.containers || [])
  //   .filter((container: IContainer) => container.id === parseInt(sessionId, 10))
  //   .flatMap((container) => container.records);

  const result = {};

  for (const containerRecord of container.records) {
    const context = getContextByRecord(contexts, `${containerRecord.id}`);
    if (!context) continue;
    for (const c of context) {
      result[c.recordId] = c;
    }
  }

  return result;
};

const getSessionParticipant = (
  container: IContainer,
  participants: Participant[]
): Record<string, Participant> => {
  // const containerRecordList = (volumeInfo.containers || [])
  //   .filter((container: IContainer) => container.id === parseInt(sessionId, 10))
  //   .flatMap((container) => container.records);

  for (const containerRecord of container.records) {
    const participant = getParticipantByRecord(
      participants,
      `${containerRecord.id}`
    );

    if (participant) return { [participant.id]: participant };
  }

  return {};
};

const getAssets = (volumeId: string, container: IContainer): Asset[] => {
  return container.assets.map((asset) => ({
    volumeId,
    assetId: `${asset.id}`,
    assetName: asset.name,
    sessionId: `${container.id}`,
    sessionName: container.name,
    percentage: 0,
    path: undefined,
  }));
};

const getSessionAsset = (
  container: IContainer,
  assetList: Asset[]
): Record<string, Asset> => {
  if (!assetList) return {};

  let result: Record<number, Asset> = {};

  for (const asset of assetList) {
    result = {
      ...result,
      [asset.assetId]: asset,
    };
  }

  return result;
};

const getSession = (
  container: IContainer,
  participants: Participant[],
  contexts: Context[],
  assets: Asset[]
): Session => {
  return {
    ...container,
    id: `${container.id}`,
    participants: getSessionParticipant(container, participants),
    contexts: getSessionContext(container, contexts),
    assets: getSessionAsset(container, assets),
  };
};

const getSessions = (
  volumeId: string,
  containers: IContainer[],
  records: IRecord[]
): Record<string, Session> => {
  const participantList = getParticipants(records);
  const contextList = getContexts(records);
  const sessions = {};
  for (const container of containers) {
    const assetList = getAssets(volumeId, container);
    const session = getSession(
      container,
      participantList,
      contextList,
      assetList
    );

    sessions[session.id] = session;
  }

  return sessions;
};

export const getVolume = (volume: IVolume | Error): Volume | Error => {
  const { containers, records, id, ...rest } = volume as IVolume;
  const sessions = getSessions(
    `${(volume as IVolume).id}`,
    containers,
    records
  );

  return {
    ...rest,
    id: `${id}`,
    sessions,
  };
};
