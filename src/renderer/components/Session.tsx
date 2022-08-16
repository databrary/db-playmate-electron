import { useEffect, useState } from 'react';
import { Accordion, Button, Form, ListGroup, Badge } from 'react-bootstrap';
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
  const [isError, setIsError] = useState(false);

  const onCheckAllClick = (e: any) => {
    setCheckAll(e.target.checked);
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

  const checkIfErrorInAssets = (assetList: AssetType[]) => {
    return assetList.some((asset) => !asset.assetName);
  };

  useEffect(() => {
    if (!assetList) return;
    setAssetCount(assetList.length);
    setIsError(checkIfErrorInAssets(assetList));
    setAssetMap(buildAssetMap(assetList));
  }, [assetList]);

  return (
    <Accordion.Item eventKey={eventKey}>
      <Accordion.Header>
        <AccordionHeader label={getSessionLabel(sessionId, participantList)}>
          <div className="me-4">
            <Badge className={isError ? 'bg-danger' : ''} bg="primary" pill>
              {assetCount}
            </Badge>
          </div>
        </AccordionHeader>
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
