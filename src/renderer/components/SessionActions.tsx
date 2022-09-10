import { useState } from 'react';
import { IconButton, Tooltip, Box, CircularProgress } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { Context, Participant, Session as SessionType } from '../../types';
import { BOX_MAP, TOOLTIP_MESSAGES } from '../../constants';
import { useAppSelector } from '../hooks/store';
import { isVideoInBox } from '../slices/box';
import { RootState } from '../store/store';

type Props = {
  volumeId: string;
  volumeName: string;
  session: SessionType;
};

const SessionActions = ({ session, volumeId, volumeName }: Props) => {
  const isVideoLreadyUploaded = useAppSelector((state: RootState) =>
    isVideoInBox(state, session.id)
  );
  const [isUploadStarted, setIsUploadStarted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadDone, setIsUploadDone] = useState(false);

  const onQA = (folderId: string) => {
    window.electron.ipcRenderer.invoke('uploadFiles', [folderId]);
  };

  const buildDatavyuTemplateName = (volumeId: string, sessionId: string) => {
    return `PLAY_${volumeId}_${sessionId}`;
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
      volumeId,
      sessionId: session.id,
      date: session.date || null,
      siteId: volumeName.split('_')[1] || '',
    };
    window.electron.ipcRenderer.invoke('downloadOPF', [arg]);
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
          disabled={!volumeId || !session.id}
          onClick={(_) =>
            onDownloadDatavyuTemplate(
              buildDatavyuTemplateName(volumeId, session.id)
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
        <Tooltip
          title={
            isVideoLreadyUploaded
              ? TOOLTIP_MESSAGES.BOX_VIDEO_ALREADY_UPLOADED
              : TOOLTIP_MESSAGES.BOX_VIDEO_UPLOAD
          }
          placement="top"
        >
          <div>
            <IconButton
              aria-label="upload-video"
              onClick={onUploadVideo}
              disabled={isVideoLreadyUploaded}
            >
              <UploadIcon />
            </IconButton>
          </div>
        </Tooltip>
      )}
    </Box>
  );
};

export default SessionActions;
