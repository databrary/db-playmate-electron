import { useEffect, useState } from 'react';
import { Accordion, Button, Form, ListGroup } from 'react-bootstrap';
import { Asset as AssetType, Participant } from '../../types';
import AccordionHeader from './AccordionHeader';
import Asset from './Asset';

type Props = {
  sessionId: string;
  assetList: AssetType[];
  participantList: Participant[];
  eventKey: string;
};

const Session = ({
  sessionId,
  assetList,
  participantList,
  eventKey,
}: Props) => {
  const [checkAll, setCheckAll] = useState(false);
  const [assetMap, setAssetMap] = useState<Record<number, AssetType>>();
  const [assetCount, setAssetCount] = useState(0);

  const onCheckAllClick = (e: any) => {
    setCheckAll(e.target.checked);
  };

  const handleAssetDownloadEvents = (...args: unknown[]) => {
    if (!args) return;
    console.log('ARGS', args);

    const newAsset = (args as any[])[0];
    if (!newAsset) return;

    setAssetMap({
      ...assetMap,
      [newAsset.assetid]: { ...newAsset },
    });
  };

  const handleAssetDownloadDoneEvent = (...args: unknown[]) => {
    window.electron.ipcRenderer.removeListener(
      'assetDownloadStarted',
      handleAssetDownloadEvents
    );
    window.electron.ipcRenderer.removeAllListeners('assetDownloadProgress');
    window.electron.ipcRenderer.removeAllListeners('assetDownloadProgress');
  };

  const getSessionLabel = (
    sessionId: string,
    participantList: Participant[]
  ) => {
    return `Session ${sessionId} ${
      participantList && participantList.length > 0
        ? `- Participant ID: ${participantList
            .map((participant) => participant.id)
            .join(',')}`
        : ``
    }`;
  };

  const buildAssetMap = (assetList: AssetType[]): Record<number, AssetType> => {
    return assetList.reduce(
      (previous, current) => ({ ...previous, [current.assetId]: current }),
      {}
    );
  };

  useEffect(() => {
    if (!assetList) return;
    setAssetCount(assetList.length);
    setAssetMap(buildAssetMap(assetList));
  }, [assetList]);

  useEffect(() => {
    // Cleanup
    // eslint-disable-next-line consistent-return
    // return () => {
    // };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header>
        <AccordionHeader
          label={getSessionLabel(sessionId, participantList)}
          badgeValue={assetCount}
        />
      </Accordion.Header>
      <Accordion.Body>
        <ListGroup variant="flush">
          <ListGroup.Item className="d-flex justify-content-start align-items-center">
            <Form.Check
              checked={checkAll}
              onChange={() => null}
              onClick={onCheckAllClick}
              className="mx-2 me-auto"
              aria-label="option 1"
            />
            <Button
              variant="light"
              className="bi bi-cloud-download bg-transparent"
              // disabled={!checkAll}
              disabled={false}
            />
          </ListGroup.Item>
          {(Object.values(assetMap || {}) || []).map((asset, idx) => (
            <Asset key={idx} asset={asset} checked={checkAll} />
          ))}
        </ListGroup>
      </Accordion.Body>
    </Accordion.Item>
  );
};

export default Session;
