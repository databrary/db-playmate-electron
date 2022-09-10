import { useEffect, useState } from 'react';
import { Box, Divider, ListItem, ListItemText } from '@mui/material';
import { Asset as AssetType, Progress } from '../../types';
import AssetDownload from './AssetDownload';
import AssetDone from './AssetDone';
import AssetProgress from './AssetProgress';

type Props = {
  asset: AssetType;
};

const Asset = ({ asset: assetProp }: Props) => {
  const [asset, setAsset] = useState<AssetType>({} as AssetType);
  const [downloadProgress, setDownloadProgress] = useState<
    Progress | undefined
  >(undefined);

  useEffect(() => {
    setAsset(assetProp || {});
  }, [assetProp]);

  const handleDownloadProgress = (...args: Progress[]) => {
    setDownloadProgress(args[0]);
  };

  const onClick = () => {
    window.electron.ipcRenderer.on<Progress>(
      `downloadProgress-${asset.assetId}`,
      handleDownloadProgress
    );
    window.electron.ipcRenderer.invoke(`downloadAssets`, [
      { name: asset.assetName, id: asset.assetId },
    ]);
  };

  return (
    <>
      <Box
        sx={{
          mx: 2,
        }}
      >
        <ListItem
          secondaryAction={
            <>
              {downloadProgress && downloadProgress.status === 'DONE' && (
                <AssetDone />
              )}
              {downloadProgress && downloadProgress.status === 'PROGRESS' && (
                <AssetProgress value={downloadProgress.percentage} size={20} />
              )}
              {(!downloadProgress ||
                !downloadProgress.status ||
                (downloadProgress &&
                  downloadProgress.status === 'ERRORED')) && (
                <AssetDownload onClick={onClick} />
              )}
            </>
          }
          disablePadding
        >
          <ListItemText primary={asset.assetName || asset.assetId} />
        </ListItem>
      </Box>
      <Divider variant="middle" />
    </>
  );
};

export default Asset;
