import { useState } from 'react';
import { IconButton, Tooltip, Box, CircularProgress } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { Context, Participant, Session as SessionType } from '../../types';
import { BOX_MAP } from '../../constants';

type Props = {
  volumeId: string;
  session: SessionType;
};

const SessionActions = ({ session, volumeId }: Props) => {
  const [isUploadStarted, setIsUploadStarted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadDone, setIsUploadDone] = useState(false);

  const onQA = (folderId: string) => {
    window.electron.ipcRenderer.invoke('uploadFiles', [folderId]);
  };

  const buildDatavyuTemplateName = (volumeId: string, sessionId: string) => {
    return `PLAY_${volumeId}_${session.id}`;
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
      `PLAY_${volumeId}_${session.id}_NaturalPlay`,
    ]);
  };

  const onDownloadDatavyuTemplate = (fileName: string) => {
    const arg: Record<string, unknown> = {
      fileName,
      ...(Object.values(session.participants)[0] || ({} as Participant)),
      ...(Object.values(session.contexts)[0] || ({} as Context)),
      id: volumeId,
      date: session.date || null,
    };
    window.electron.ipcRenderer.invoke('downloadFiles', [arg]);
  };
  return (
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

      <Tooltip title="Generate OPF Template for this Session" placement="top">
        <IconButton
          aria-label="download-opf"
          onClick={(_) =>
            onDownloadDatavyuTemplate(
              buildDatavyuTemplateName(volumeId || 'VOL', session.id)
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
  );
};

export default SessionActions;
