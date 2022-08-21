import { useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  IconButton,
  List,
  Typography,
  Box,
  Tooltip,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import FaceIcon from '@mui/icons-material/Face';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { Asset as AssetType, Context, Participant } from '../../types';
import Asset from './Asset';
import { BOX_MAP } from '../../constants';

type Props = {
  volumeId: string;
  sessionId: string;
  assetList: AssetType[];
  participantList: Participant[];
  contextList?: Context[];
  date?: string | undefined;
};

const Session = ({
  volumeId,
  sessionId,
  assetList,
  participantList,
  contextList = [],
  date = undefined,
}: Props) => {
  const [assetMap, setAssetMap] = useState<Record<number, AssetType>>();
  const [assetCount, setAssetCount] = useState(0);
  const [isError, setIsError] = useState(false);
  const [isUploadStarted, setIsUploadStarted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadDone, setIsUploadDone] = useState(false);

  const buildDatavyuTemplateName = (volumeId: string, sessionId: string) => {
    return `PLAY_${volumeId}_${sessionId}`;
  };

  const onDownloadDatavyuTemplate = (fileName: string) => {
    const arg: Record<string, unknown> = {
      fileName,
      ...participantList[0],
      ...contextList[0],
      id: volumeId,
    };
    if (date) arg.date = date;
    window.electron.ipcRenderer.invoke('downloadFiles', [arg]);
  };

  const onQA = (folderId: string) => {
    window.electron.ipcRenderer.invoke('uploadFiles', [folderId]);
  };

  const handleUploadStartedEvent = (...args: unknown[]) => {
    setIsUploadStarted(true);
  };

  const handleUploadProgressEvent = (...args: unknown[]) => {
    setUploadProgress(args[0] as number);
  };

  const handleUploadDoneEvent = (...args: unknown[]) => {
    setIsUploadDone(true);
  };

  const onUploadVideo = () => {
    window.electron.ipcRenderer.on(
      'uploadVideoStarted',
      handleUploadStartedEvent
    );
    window.electron.ipcRenderer.on(
      'uploadVideoProgress',
      handleUploadProgressEvent
    );
    window.electron.ipcRenderer.on('uploadVideoDone', handleUploadDoneEvent);
    window.electron.ipcRenderer.on('uploadVideoDone', handleUploadDoneEvent);

    window.electron.ipcRenderer.invoke('uploadVideo', [
      `PLAY_${volumeId}_${sessionId}_NaturalPlay`,
    ]);
  };

  const getSessionLabel = (sessionId: string) => {
    return `Session ${sessionId}`;
  };

  const getSessionParticipantId = (participantList: Participant[]): string => {
    return participantList.map((participant) => participant.id).join(',');
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
    <>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Typography>{getSessionLabel(sessionId)}</Typography>
            <Chip
              sx={{
                mr: 2,
              }}
              icon={<FaceIcon />}
              size="small"
              color="primary"
              label={getSessionParticipantId(participantList)}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Divider variant="middle" />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <Tooltip title="Failed QA" placement="top">
              <IconButton
                color="error"
                aria-label="pass"
                onClick={() => onQA(BOX_MAP.QA_FAILED)}
              >
                <ThumbDownIcon />
              </IconButton>
            </Tooltip>
            <Tooltip
              title="Passed QA"
              placement="top"
              onClick={() => onQA(BOX_MAP.QA_PASSED)}
            >
              <IconButton color="success" aria-label="fail">
                <ThumbUpIcon />
              </IconButton>
            </Tooltip>

            <Tooltip
              title="Generate OPF Template for this Session"
              placement="top"
            >
              <IconButton
                aria-label="download-opf"
                onClick={(_) =>
                  onDownloadDatavyuTemplate(
                    buildDatavyuTemplateName(volumeId || 'VOL', sessionId)
                  )
                }
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            {isUploadStarted && (
              <CircularProgress
                variant="determinate"
                value={uploadProgress}
                size={24}
              />
            )}
            {isUploadDone && (
              <IconButton aria-label="download-done">
                <DownloadDoneIcon />
              </IconButton>
            )}
            {!isUploadStarted && !isUploadDone && (
              <Tooltip title="Upload Video to BOX" placement="top">
                <IconButton aria-label="upload-video" onClick={onUploadVideo}>
                  <UploadIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          <Divider variant="middle" />

          <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
            {(Object.values(assetMap || {}) || []).map((asset, idx) => (
              <Asset key={idx} asset={asset} />
            ))}
          </List>
        </AccordionDetails>
      </Accordion>
    </>
  );
};

export default Session;
