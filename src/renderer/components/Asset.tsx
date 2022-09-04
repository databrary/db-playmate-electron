import { useEffect, useState } from 'react';
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { Asset as AssetType } from '../../types';

type Props = {
  asset: AssetType;
};

const Asset = ({ asset: assetProp }: Props) => {
  const [asset, setAsset] = useState<AssetType>({} as AssetType);
  const [isDownloadDone, setIsDownloadDone] = useState(false);
  const [isDownloadStarted, setIsDownloadStarted] = useState(false);
  const [isDownloadError, setIsDownloadError] = useState(false);

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

  const handleAssetDownloadStartedEvents = (...args: unknown[]) => {
    handleAssetDownloadEvents(args);
    setIsDownloadStarted(true);
  };

  const handleAssetDownloadDoneEvent = (...args: unknown[]) => {
    handleAssetDownloadEvents(args);
    setIsDownloadDone(true);
  };

  const onClick = () => {
    window.electron.ipcRenderer.on(
      'assetDownloadStarted',
      handleAssetDownloadStartedEvents
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
    <>
      <Box
        sx={{
          mx: 2,
        }}
      >
        <ListItem
          secondaryAction={
            <>
              {isDownloadError && (
                <IconButton aria-label="download-error" size="small">
                  <ErrorIcon />
                </IconButton>
              )}
              {isDownloadDone && !isDownloadError && (
                <IconButton aria-label="download-done" size="small">
                  <DownloadDoneIcon />
                </IconButton>
              )}
              {isDownloadStarted && !isDownloadDone && !isDownloadError && (
                <CircularProgress
                  variant="determinate"
                  value={asset.percentage}
                  size="small"
                />
              )}
              {!isDownloadStarted && !isDownloadError && (
                <Tooltip title="Download Video from Databrary" placement="top">
                  <IconButton
                    aria-label="download"
                    onClick={onClick}
                    size="small"
                  >
                    <YouTubeIcon />
                  </IconButton>
                </Tooltip>
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
