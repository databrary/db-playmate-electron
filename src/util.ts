import { ParsedPath, resolve, parse } from 'path';
import { createWriteStream } from 'fs';
import {
  Context,
  Volume,
  Session,
  Participant,
  Asset,
  Study,
  StudyFunctions,
  Channels,
  Progress,
  EntityProgress,
  Entity,
} from './types';
import { IContainer, IRecord, IVolume } from './interfaces';
import { Cell, OPF } from './OPF';
import { downloadBuffer, ls } from './services/box-service';
import { BOX_MAP, defaultVolume } from './constants';
import { downloadAsset, getVolumeInfo } from './services/databrary-service';

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
  const result: any = {};

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
  const sessions: any = {};
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

export const getVolume = (volume: IVolume): Volume => {
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

const buildOPF = (qa: OPF, qaTemplate: OPF, columns: string[]) => {
  const playId = qa.column('PLAY_ID');

  if (qaTemplate.column('PLAY_ID')) {
    const column = qaTemplate.clearColumn('PLAY_ID');
    column.addCells(playId.cells);
  } else {
    qaTemplate.addColumn('PLAY_ID', playId);
  }

  const missingChild = qa.column('missing_child');

  if (qaTemplate.column('missing_child')) {
    const column = qaTemplate.clearColumn('missing_child');
    column.addCells(missingChild.cells);
  } else {
    qaTemplate.addColumn('missing_child', missingChild);
  }

  columns.forEach((col) => {
    const column = qaTemplate.column(col);
    if (!column.cells.length) {
      column.addCell(
        new Cell(
          `(${Array(column.codes.length).fill('').join(',')})`,
          playId.cell(0).onset,
          playId.cell(0).offset
        )
      );
    } else {
      column.cells.forEach((cell) => {
        cell.onset = playId.cell(0).onset;
        cell.offset = playId.cell(0).offset;
      });
    }
  });

  return qaTemplate;
};

export const downloadAssetPromise = async (
  id: string,
  filePath: string,
  onEvent: <T>(channel: Channels, payload: T) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const stream = createWriteStream(filePath, {
      autoClose: true,
    });

    let progress: Progress = {
      id,
      path: filePath,
      status: undefined,
      percentage: 0,
      message: undefined,
      name: parse(filePath).base,
    };

    downloadAsset(id)
      .then((response) => {
        progress = {
          ...progress,
          status: 'STARTED',
        };

        onEvent<Progress>(`downloadProgress-${id}`, progress);

        const writer = response.data.pipe(stream);
        const totalSize = response.headers['content-length'];

        let downloaded = 0;

        response.data.on('data', (data: any) => {
          downloaded += Buffer.byteLength(data);

          progress = {
            ...progress,
            status: 'PROGRESS',
            percentage: Math.floor((downloaded / parseFloat(totalSize)) * 100),
          };

          onEvent<Progress>(`downloadProgress-${id}`, progress);
        });

        response.data.on('end', () => {
          console.log(`Downloaded Asset ${id}`);
        });

        writer.on('finish', () => {
          progress = {
            ...progress,
            status: 'DONE',
            percentage: 100,
          };
          onEvent<Progress>(`downloadProgress-${id}`, progress);
          resolve();
        });

        return null;
      })
      .catch((error) => {
        console.log(`Error while downloading asset ${id}`, error.message);
        progress = {
          ...progress,
          status: 'ERRORED',
          message: `${error.message}`,
        };
        onEvent<Progress>(`downloadProgress-${id}`, progress);
        // onError<Asset>(asset.assetId, error);
        reject();
      });
  });
};

export const getVolumes = async (
  onEvent: (channel: Channels, payload: string) => void,
  volumes: string[]
) => {
  const volumesMap: Record<string, Volume> = {};
  for (const volumeId of volumes) {
    try {
      onEvent('status', `Fetching Volume ${volumeId} data...`);
      // eslint-disable-next-line no-await-in-loop
      const volumeInfo = await getVolumeInfo(volumeId);
      volumesMap[volumeId] = getVolume(volumeInfo);
    } catch (error) {
      console.log(`getVolumes - ${volumeId} - Error`, (error as any).message);

      onEvent('status', `Error while fetching Volume ${volumeId} data...`);
      volumesMap[volumeId] = {
        ...defaultVolume,
        id: volumeId,
      };
    }
  }
  return volumesMap;
};

export const getQAFailed = async (
  onEvent: (channel: Channels, payload: string) => void,
  folderId = BOX_MAP.QA_FAILED
) => {
  try {
    onEvent('status', 'Fetching Failed QA...');
    const entries = await ls(folderId);
    return entries;
  } catch (error) {
    console.log('getQAFailed - Error', (error as any).message);
    onEvent('status', 'Error Fetching Failed QA...');
  }
  return [];
};

export const getQAPassed = async (
  onEvent: (channel: Channels, payload: string) => void,
  folderId = BOX_MAP.QA_PASSED
) => {
  try {
    onEvent('status', 'Fetching Passed QA...');
    const entries = await ls(folderId);
    return entries;
  } catch (error) {
    console.log('getQAPassed - Error', (error as any).message);
    onEvent('status', 'Error Fetching Passed QA...');
  }

  return [];
};

export const getBoxVideos = async (
  onEvent: (channel: Channels, payload: string) => void,
  folderId = BOX_MAP.UPLOAD_PASSED_VIDEO
) => {
  try {
    onEvent('status', 'Fetching Box Videos...');
    const entries = await ls(folderId);
    return entries;
  } catch (error) {
    console.log('getBoxVideos - Error', (error as any).message);
    onEvent('status', 'Error Fetching Box Videos...');
  }

  return [];
};

export const getEntitiesProgress = async (
  onEvent: (channel: Channels, payload: string) => void,
  type: Study,
  folderId: string
): Promise<Entity[]> => {
  try {
    onEvent('status', `Fetching ${type} list...`);
    const entities: Entity[] = [];
    const entries = await ls(folderId);
    for (const entry of entries) {
      if (entry.name.toLocaleLowerCase().includes('inactive')) continue;

      // eslint-disable-next-line no-await-in-loop
      const transcriberFolders = await ls(`${entry.id}`);
      const toDo: EntityProgress = {
        folderId: undefined,
        volumes: [],
      };
      const inProgress: EntityProgress = {
        folderId: undefined,
        volumes: [],
      };
      const done: EntityProgress = {
        folderId: undefined,
        volumes: [],
      };

      for (const folder of transcriberFolders) {
        // eslint-disable-next-line no-await-in-loop
        if (folder.name === '1_ToBeCoded_DownloadOnly') {
          toDo.folderId = `${folder.id}`;
          // eslint-disable-next-line no-await-in-loop
          toDo.volumes = await ls(toDo.folderId);
        } else if (folder.name === '2_InProgress') {
          inProgress.folderId = `${folder.id}`;
          // eslint-disable-next-line no-await-in-loop
          inProgress.volumes = await ls(inProgress.folderId);
        } else if (folder.name === '3_Submitted_CannotEditAnymore') {
          done.folderId = `${folder.id}`;
          // eslint-disable-next-line no-await-in-loop
          done.volumes = await ls(done.folderId);
        }
      }

      entities.push({
        type,
        name: entry.name.split('_').at(-1) || '',
        folderId: `${entry.id}`,
        toDo,
        inProgress,
        done,
      });
    }
    return entities;
  } catch (error) {
    console.log('getEntitiesProgress - Error', (error as any).message);
    onEvent('status', `Error Fetching ${type} list...`);
  }
  return [];
};

export const STUDY_MAP: Record<Study, StudyFunctions> = {
  EMO: {
    build: (qaOPF: OPF, template: OPF) =>
      buildOPF(qaOPF, template, ['emo_id_child', 'emo_id_mom']),
    download: async (
      fileId = BOX_MAP.QA_DATAVYU_TEMPLATE_EMO
    ): Promise<Buffer> => {
      const buffer = await downloadBuffer(fileId);
      return buffer;
    },
    buildFileName: (name: string, ext = 'opf') => {
      return `${name}-emo.${ext}`;
    },
    resolveFilePath: (filePath: ParsedPath) => {
      return resolve(filePath.dir, `${filePath.name}-emo.${filePath.ext}`);
    },
  },
  LOC: {
    build: (qaOPF: OPF, template: OPF) =>
      buildOPF(qaOPF, template, ['loc_id_child', 'loc_id_mom']),
    download: async (
      fileId = BOX_MAP.QA_DATAVYU_TEMPLATE_LOC
    ): Promise<Buffer> => {
      const buffer = await downloadBuffer(fileId);
      return buffer;
    },
    buildFileName: (name: string, ext = 'opf') => {
      return `${name}-loc.${ext}`;
    },
    resolveFilePath: (filePath: ParsedPath) => {
      return resolve(filePath.dir, `${filePath.name}-loc.${filePath.ext}`);
    },
  },
  OBJ: {
    build: (qaOPF: OPF, template: OPF) =>
      buildOPF(qaOPF, template, ['obj_id_child', 'obj_id_mom']),
    download: async (
      fileId = BOX_MAP.QA_DATAVYU_TEMPLATE_OBJ
    ): Promise<Buffer> => {
      const buffer = await downloadBuffer(fileId);
      return buffer;
    },
    buildFileName: (name: string, ext = 'opf') => {
      return `${name}-obj.${ext}`;
    },
    resolveFilePath: (filePath: ParsedPath) => {
      return resolve(filePath.dir, `${filePath.name}-obj.${filePath.ext}`);
    },
  },
  TRA: {
    build: (qaOPF: OPF, template: OPF) =>
      buildOPF(qaOPF, template, ['transc_id']),
    download: async (
      fileId = BOX_MAP.QA_DATAVYU_TEMPLATE_TRA
    ): Promise<Buffer> => {
      const buffer = await downloadBuffer(fileId);
      return buffer;
    },
    buildFileName: (name: string, ext = 'opf') => {
      return `${name}-tra.${ext}`;
    },
    resolveFilePath: (filePath: ParsedPath) => {
      return resolve(filePath.dir, `${filePath.name}-tra.${filePath.ext}`);
    },
  },
};
