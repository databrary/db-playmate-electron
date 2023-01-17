import { useState } from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { useSnackbar } from 'notistack';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { Context, Participant, QA, Session as SessionType } from '../../types';
import { BOX_MAP, TOOLTIP_MESSAGES } from '../../constants';
import { useAppSelector } from '../hooks/store';
import { isVideoInBox } from '../slices/box';
import { RootState } from '../store/store';
import AssetProgress from './AssetProgress';

type Props = {
  volumeId: string;
  volumeName: string;
  session: SessionType;
  status?: QA;
  disabled?: boolean;
};

const SessionActions = ({
  session,
  volumeId,
  volumeName,
  disabled = false,
  status = 'UNKNOWN',
}: Props) => {
  const { enqueueSnackbar } = useSnackbar();

  const isVideoAlreadyUploaded = useAppSelector((state: RootState) =>
    isVideoInBox(state, session.id)
  );

  const [isUploadStarted, setIsUploadStarted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadDone, setIsUploadDone] = useState(false);

  const onQA = (folderId: string) => {
    window.electron.ipcRenderer
      .invoke('uploadFile', [folderId])
      .then((file) => {
        enqueueSnackbar(`File Uploaded`, { variant: 'success' });
      })
      .catch((error) =>
        enqueueSnackbar(`Error uploading QA File ${error.message}`, {
          variant: 'error',
        })
      );
  };

  const buildDatavyuTemplateName = (volumeId: string, sessionId: string) => {
    return `PLAY_${volumeId}_${sessionId}_qa`;
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

  const handleUploadErrorEvent = (...args: unknown[]) => {
    enqueueSnackbar(`Error uploading Video to BOX ${args[0]}`, {
      variant: 'error',
    });
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
    window.electron.ipcRenderer.on('uploadVideoError', handleUploadErrorEvent);

    window.electron.ipcRenderer.invoke('uploadVideo', [
      `PLAY_${volumeId}_${session.id}_NaturalPlay`,
    ]);
  };

  const onDownloadDatavyuTemplate = (fileName: string) => {
    const arg: Record<string, string> = {
      fileName,
      ...(Object.values(session.contexts)[0] || ({} as Context)),
      ...(Object.values(session.participants)[0] || ({} as Participant)),
      volumeId,
      sessionId: session.id,
      date: session.date,
      siteId: volumeName.split('_')[1] || '',
    };
    window.electron.ipcRenderer.invoke('downloadOPF', [arg]);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          ml: 'auto',
        }}
      >
        <Tooltip title="Failed QA" placement="top">
          <div>
            <IconButton
              color="error"
              aria-label="pass"
              onClick={() => onQA(BOX_MAP.QA_FAILED)}
              disabled={disabled}
            >
              <ThumbDownIcon />
            </IconButton>
          </div>
        </Tooltip>
        <Tooltip
          title="Passed QA"
          placement="top"
          onClick={() => onQA(BOX_MAP.QA_PASSED)}
        >
          <div>
            <IconButton color="success" aria-label="fail" disabled={disabled}>
              <ThumbUpIcon />
            </IconButton>
          </div>
        </Tooltip>

        <Tooltip title="Generate OPF Template for this Session" placement="top">
          <div>
            <IconButton
              aria-label="download-opf"
              disabled={!volumeId || !session.id || disabled}
              onClick={(_) =>
                onDownloadDatavyuTemplate(
                  buildDatavyuTemplateName(volumeId, session.id)
                )
              }
            >
              <DownloadIcon />
            </IconButton>
          </div>
        </Tooltip>
        {isUploadStarted && !isUploadDone && (
          <AssetProgress
            variant={uploadProgress === 0 ? undefined : 'determinate'}
            value={uploadProgress}
            size={20}
          />
        )}
        {(!isUploadStarted || isUploadDone) && (
          <Tooltip
            title={
              isVideoAlreadyUploaded || isUploadDone
                ? TOOLTIP_MESSAGES.BOX_VIDEO_ALREADY_UPLOADED
                : TOOLTIP_MESSAGES.BOX_VIDEO_UPLOAD
            }
            placement="top"
          >
            <div>
              <IconButton
                aria-label="upload-video"
                onClick={onUploadVideo}
                disabled={isVideoAlreadyUploaded || isUploadDone || disabled}
              >
                <UploadIcon />
              </IconButton>
            </div>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default SessionActions;
