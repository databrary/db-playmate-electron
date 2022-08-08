import { CSSProperties, useEffect, useState } from 'react';
import { Accordion, Spinner, Badge } from 'react-bootstrap';
import { IVolumeInfo, IRecord } from '../../interfaces';
import { Asset, Participant } from '../../types';
import AccordionHeader from './AccordionHeader';
import Session from './Session';

type Props = {
  volumeId: string;
  eventkey: string;
  style?: CSSProperties;
  className?: string;
};
const Volume = ({
  volumeId,
  eventkey,
  style = undefined,
  className = undefined,
}: Props) => {
  const [sessionsMap, setSessionsMap] = useState<Record<string, Asset[]>>({});
  const [volumeName, setVolumeName] = useState<string | null>(null);
  const [assetList, setAssetList] = useState<Asset[]>([]);
  const [participantList, setParticipantList] = useState<Participant[]>([]);
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

  const getParticipantFromRecords = (recordList: IRecord[]): Participant[] => {
    return recordList
      .filter((record) => record.category === 1)
      .map((obj) => {
        return {
          recordId: obj.id,
          id: obj.measures[1],
          gender: obj.measures[5],
        } as Participant;
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

  const getSessionParticipant = (
    sessionId: string,
    participantList: Participant[]
  ) => {
    const containerRecordList =
      volumeInfo.containers.find((container: any) => container.id === sessionId)
        ?.records || [];

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
    // eslint-disable-next-line promise/catch-or-return
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
    if (!volumeInfo) return;
    setVolumeName(volumeInfo.name);

    if (!volumeInfo.containers) return;

    setAssetList(
      volumeInfo.containers.flatMap((container) =>
        container.assets.map((asset) => ({
          assetId: asset.id,
          assetName: asset.name,
          sessionId: container.id,
          sessionName: container.name,
          percentage: undefined,
          path: undefined,
        }))
      )
    );

    if (!volumeInfo.records) return;

    setParticipantList(getParticipantFromRecords(volumeInfo.records));
  }, [volumeInfo]);

  const getVolumeLabel = () => {
    return `Volume ${volumeId} ${volumeName ? `- ${volumeName}` : ``}`;
  };

  return (
    <Accordion.Item eventKey={eventkey} className={className} style={style}>
      <Accordion.Header>
        <AccordionHeader label={getVolumeLabel()}>
          <div className="me-4">
            {isFetching ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <Badge
                className={isError ? 'bi bi-bug-fill bg-danger' : ''}
                bg="primary"
                pill
              >
                {!isError ? (Object.keys(sessionsMap) || []).length : ' '}
              </Badge>
            )}
          </div>
        </AccordionHeader>
      </Accordion.Header>
      {!isError && (Object.keys(sessionsMap) || []).length > 0 && (
        <Accordion.Body>
          <Accordion defaultActiveKey="0">
            {(Object.keys(sessionsMap) || []).map((sessionId, idx) => {
              return (
                <Session
                  key={sessionId}
                  sessionId={sessionId}
                  assetList={sessionsMap[sessionId]}
                  participantList={getSessionParticipant(
                    sessionId,
                    participantList
                  )}
                  eventKey={`${idx}`}
                />
              );
            })}
          </Accordion>
        </Accordion.Body>
      )}
    </Accordion.Item>
  );
};

export default Volume;
