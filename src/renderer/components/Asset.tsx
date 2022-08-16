import { useEffect, useState } from 'react';
import { Form, ListGroup, Button, Badge } from 'react-bootstrap';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Asset as AssetType } from '../../types';

type Props = {
  asset: AssetType;
  checked?: boolean;
};

const Asset = ({ asset: assetProp, checked = false }: Props) => {
  const [asset, setAsset] = useState<AssetType>({} as AssetType);
  const [isError, setIsError] = useState(false);
  const [isDownloadDone, setIsDownloadDone] = useState(false);

  useEffect(() => {
    if (!assetProp) return;

    setAsset(assetProp);
    setIsError(!assetProp.assetName);
  }, [assetProp]);

  const handleAssetDownloadEvents = (...args: unknown[]) => {
    if (!args) return;

    const newAsset = args[0] as AssetType;

    if (!newAsset || newAsset.assetId !== asset.assetId) return;

    setAsset(newAsset);
  };

  const handleAssetDownloadDoneEvent = (...args: unknown[]) => {
    handleAssetDownloadEvents(args);
    setIsDownloadDone(true);
  };

  const onClick = () => {
    window.electron.ipcRenderer.on(
      'assetDownloadStarted',
      handleAssetDownloadEvents
    );
    window.electron.ipcRenderer.on(
      'assetDownloadProgress',
      handleAssetDownloadEvents
    );
    window.electron.ipcRenderer.on(
      'assetDownloadDone',
      handleAssetDownloadDoneEvent
    );

    window.electron.ipcRenderer.invoke('downloadAssets', [asset]);
  };

  return (
    <ListGroup.Item className="d-flex justify-content-start align-items-center">
      <Form.Check
        disabled
        checked={checked}
        className="mx-2"
        aria-label="option 1"
      />
      <div className={isError ? '' : ' '}>
        {asset.assetName || asset.assetId}
        {isError && (
          <Badge
            bg="light"
            text="dark"
            className="ms-2 bi bi-info-circle bg-transparent"
          >
            <span className="ms-1 text-danger">Asset Name is missing</span>
          </Badge>
        )}
      </div>
      <div
        className="d-flex ms-auto justify-content-end align-items-center"
        style={{ width: '25px', height: '25px' }}
      >
        {isDownloadDone && (
          <Badge
            bg="success"
            className="bi bi-check-circle bg-transparent"
            text="dark"
          >
            {'  '}
          </Badge>
        )}
        {asset.percentage && !isDownloadDone && (
          <CircularProgressbar
            value={asset.percentage}
            strokeWidth={15}
            styles={buildStyles({
              strokeLinecap: 'butt',
            })}
          />
        )}
        {!asset.percentage && !isDownloadDone && (
          <Button
            size="sm"
            variant="light"
            className="bi bi-download bg-transparent"
            style={{ fill: 'currentcolor' }}
            disabled={checked}
            onClick={onClick}
          />
        )}
      </div>
    </ListGroup.Item>
  );
};

export default Asset;
