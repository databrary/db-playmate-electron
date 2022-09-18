import { useEffect, useState } from 'react';
import { Box, Divider, ListItem, ListItemText } from '@mui/material';
import { useSnackbar } from 'notistack';
import { Asset as AssetType, Progress } from '../../types';
import AssetDownload from './AssetDownload';
import AssetProgress from './AssetProgress';

type Props = {
  asset: AssetType;
};

const Asset = ({ asset: assetProp }: Props) => {
  const { enqueueSnackbar } = useSnackbar();

  const [asset, setAsset] = useState<AssetType>({} as AssetType);
  const [downloadProgress, setDownloadProgress] = useState<
    Progress | undefined
  >(undefined);

  useEffect(() => {
    setAsset(assetProp || {});
  }, [assetProp]);

  useEffect(() => {
    if (!downloadProgress) return;

    if (downloadProgress.status === 'DONE') {
      enqueueSnackbar(`Asset ${downloadProgress.id} downloaded!`, {
        variant: 'success',
      });
    }
    if (downloadProgress.status === 'ERRORED') {
      enqueueSnackbar(`Error downloading Asset ${downloadProgress.id}`, {
        variant: 'error',
      });
    }
  }, [downloadProgress]);

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
              {downloadProgress && downloadProgress.status === 'PROGRESS' ? (
                <AssetProgress value={downloadProgress.percentage} size={20} />
              ) : (
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
