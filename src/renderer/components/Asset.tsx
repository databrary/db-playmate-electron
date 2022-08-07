import { useEffect, useState } from 'react';
import { Form, ListGroup, Button } from 'react-bootstrap';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Asset as AssetType } from '../../types';

type Props = {
  asset: AssetType;
  checked?: boolean;
};

const Asset = ({ asset: assetProp, checked = false }: Props) => {
  const [asset, setAsset] = useState<AssetType>({} as AssetType);

  useEffect(() => {
    if (!assetProp) return;

    setAsset(assetProp);
  }, [assetProp]);

  const handleAssetDownloadEvents = (...args: unknown[]) => {
    if (!args) return;

    const newAsset = args[0] as AssetType;

    if (!newAsset || newAsset.assetId !== asset.assetId) return;

    setAsset(newAsset);
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
      handleAssetDownloadEvents
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
      <span>{asset.assetName}</span>
      <div className="d-flex ms-auto" style={{ width: '25px', height: '25px' }}>
        {asset.percentage ? (
          <CircularProgressbar
            value={asset.percentage}
            strokeWidth={15}
            styles={buildStyles({
              strokeLinecap: 'butt',
            })}
          />
        ) : (
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
