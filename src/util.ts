import { ParsedPath, resolve } from 'path';
import {
  Context,
  Error,
  Volume,
  Session,
  Participant,
  Asset,
  Study,
  StudyFunctions,
  StudyKeys,
} from './types';
import { IContainer, IRecord, IVolume } from './interfaces';
import { Cell, OPF } from './OPF';
import { downloadFile } from './services/box-service';
import { BOX_MAP } from './constants';

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

export const STUDY_MAP: Record<Study, Record<StudyKeys, StudyFunctions>> = {
  EMO: {
    build: (qaOPF: OPF, template: OPF) =>
      buildOPF(qaOPF, template, ['emo_id_child', 'emo_id_mom']),
    download: async (
      filePath: string,
      fileId = BOX_MAP.QA_DATAVYU_TEMPLATE_EMO
    ) => {
      await downloadFile(fileId, filePath);
    },
    resolveFilePath: (filePath: ParsedPath) => {
      return resolve(filePath.dir, `${filePath.name}-emo.${filePath.ext}`);
    },
  },
  LOC: {
    build: (qaOPF: OPF, template: OPF) =>
      buildOPF(qaOPF, template, ['loc_id_child', 'loc_id_mom']),
    download: async (
      filePath: string,
      fileId = BOX_MAP.QA_DATAVYU_TEMPLATE_LOC
    ) => {
      await downloadFile(fileId, filePath);
    },
    resolveFilePath: (filePath: ParsedPath) => {
      return resolve(filePath.dir, `${filePath.name}-loc.${filePath.ext}`);
    },
  },
  OBJ: {
    build: (qaOPF: OPF, template: OPF) =>
      buildOPF(qaOPF, template, ['obj_id_child', 'obj_id_mom']),
    download: async (
      filePath: string,
      fileId = BOX_MAP.QA_DATAVYU_TEMPLATE_OBJ
    ) => {
      await downloadFile(fileId, filePath);
    },
    resolveFilePath: (filePath: ParsedPath) => {
      return resolve(filePath.dir, `${filePath.name}-obj.${filePath.ext}`);
    },
  },
  TRA: {
    build: (qaOPF: OPF, template: OPF) =>
      buildOPF(qaOPF, template, ['transc_id']),
    download: async (
      filePath: string,
      fileId = BOX_MAP.QA_DATAVYU_TEMPLATE_TRA
    ) => {
      await downloadFile(fileId, filePath);
    },
    resolveFilePath: (filePath: ParsedPath) => {
      return resolve(filePath.dir, `${filePath.name}-tra.${filePath.ext}`);
    },
  },
};
