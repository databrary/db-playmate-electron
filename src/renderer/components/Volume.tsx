import { useEffect, useState } from 'react';
import { Typography, Backdrop, CircularProgress, Divider } from '@mui/material';
import { IVolumeInfo, IRecord, IContainer } from '../../interfaces';
import { Asset, Participant, Context } from '../../types';
import Session from './Session';

type Props = {
  volumeId: string;
};

const Volume = ({ volumeId }: Props) => {
  const [sessionsMap, setSessionsMap] = useState<Record<string, Asset[]>>({});
  const [volumeName, setVolumeName] = useState<string | null>(null);
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [participantList, setParticipantList] = useState<Participant[]>([]);
  const [contextList, setContextList] = useState<Context[]>([]);
  const [volumeInfo, setVolumeInfo] = useState<IVolumeInfo>({} as IVolumeInfo);
  const [isError, setIsError] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const getAssetsBySession = (assetList: Asset[]): Record<number, Asset[]> => {
    if (!assetList) return {};

    const result: Record<number, Asset[]> = {};

    for (const asset of assetList) {
      if (!(asset.sessionId in result)) {
        result[asset.sessionId] = [asset];
        continue;
      }

      result[asset.sessionId].push(asset);
    }

    return result;
  };

  const buildParticipantList = (recordList: IRecord[]): Participant[] => {
    return recordList
      .filter((record) => record.category === 1)
      .map((obj) => {
        return {
          recordId: obj.id,
          id: obj.measures[1],
          gender: obj.measures[5],
          birthdate: obj.measures[4],
          language: obj.measures[12],
        } as Participant;
      });
  };

  const buildContextList = (recordList: IRecord[]): Context[] => {
    return recordList
      .filter((record) => record.category === 7)
      .map((obj) => {
        return {
          recordId: obj.id,
          setting: obj.measures[33],
          language: obj.measures[34],
          country: obj.measures[35],
          state: obj.measures[36],
        } as Context;
      });
  };

  const getParticipantByRecord = (
    particpantList: Participant[],
    recordId: number
  ): Participant[] => {
    return particpantList.filter(
      (participant) => participant.recordId === recordId
    );
  };

  const getContextByRecord = (
    contextList: Context[],
    recordId: number
  ): Context[] => {
    return contextList.filter((context) => context.recordId === recordId);
  };

  const getSessionDate = (sessionId: string): string | undefined => {
    return (volumeInfo.containers || []).find(
      (container) => container.id === parseInt(sessionId, 10)
    )?.date;
  };

  const getSessionContext = (sessionId: string, contextList: Context[]) => {
    const containerRecordList = (volumeInfo.containers || [])
      .filter(
        (container: IContainer) => container.id === parseInt(sessionId, 10)
      )
      .flatMap((container) => container.records);

    const result: Context[] = [];

    for (const containerRecord of containerRecordList) {
      const context = getContextByRecord(contextList, containerRecord.id);

      if (context && context.length > 0) {
        result.push(...context);
      }
    }

    return result;
  };

  const getSessionParticipant = (
    sessionId: string,
    participantList: Participant[]
  ) => {
    const containerRecordList = (volumeInfo.containers || [])
      .filter(
        (container: IContainer) => container.id === parseInt(sessionId, 10)
      )
      .flatMap((container) => container.records);

    const result: Participant[] = [];

    for (const containerRecord of containerRecordList) {
      const participant = getParticipantByRecord(
        participantList,
        containerRecord.id
      );

      if (participant && participant.length > 0) {
        result.push(...participant);
      }
    }

    return result;
  };

  useEffect(() => {
    if (!volumeId) return;
    setIsFetching(true);
    window.electron.ipcRenderer
      .invoke<IVolumeInfo>('volumeInfo', [volumeId])
      .then((data) => setVolumeInfo(data))
      .catch((_) => setIsError(true))
      .finally(() => setIsFetching(false));
  }, [volumeId]);

  useEffect(() => {
    setSessionsMap({ ...getAssetsBySession(assetList || []) });
  }, [assetList]);

  useEffect(() => {
    if (!isError) return;

    setVolumeInfo({} as IVolumeInfo);
  }, [isError, volumeId]);

  useEffect(() => {
    if (!volumeInfo) return;
    setVolumeName(volumeInfo.name);

    setAssetList(
      (volumeInfo.containers || []).flatMap((container) =>
        container.assets.map((asset) => ({
          assetId: asset.id,
          assetName: asset.name,
          sessionId: container.id,
          sessionName: container.name,
          percentage: 0,
          path: undefined,
        }))
      )
    );

    if (!volumeInfo.records) return;

    setParticipantList(buildParticipantList(volumeInfo.records));
    setContextList(buildContextList(volumeInfo.records));
  }, [volumeInfo]);

  const getVolumeLabel = () => {
    return `Volume ${volumeId} ${volumeName ? `- ${volumeName}` : ``}`;
  };

  return (
    <>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isFetching}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold',
        }}
      >
        {getVolumeLabel()}
      </Typography>
      <Divider
        sx={{
          mt: 2,
          mb: 4,
        }}
        variant="middle"
      />
      {(Object.keys(sessionsMap) || []).map((sessionId) => {
        return (
          <Session
            key={sessionId}
            volumeId={volumeId}
            sessionId={sessionId}
            date={getSessionDate(sessionId)}
            assetList={sessionsMap[sessionId]}
            participantList={getSessionParticipant(sessionId, participantList)}
            contextList={getSessionContext(sessionId, contextList)}
          />
        );
      })}
    </>
  );
};

export default Volume;
