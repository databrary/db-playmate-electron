import { useEffect, useState } from 'react';
import {
  Chip,
  Typography,
  Box,
  Tooltip,
  List,
  ListItem,
  IconButton,
} from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InfoIcon from '@mui/icons-material/Info';
import { QA, Session } from '../../types';
import { PLAY_SESSION_NAME_CHECKS, TOOLTIP_MESSAGES } from '../../constants';

type Props = {
  volumeId: string;
  session: Session;
  status: QA;
};

const SessionSummary = ({ volumeId, session, status = 'UNKNOWN' }: Props) => {
  const [errors, setErrors] = useState<string[]>([]);
  const checkSessionName = (session: Session): string[] => {
    const errors: string[] = [];
    Object.values(PLAY_SESSION_NAME_CHECKS).forEach((check) => {
      if (!check.func(session)) errors.push(check.error);
    });
    return errors;
  };

  const getStatusColor = (status: QA) => {
    if (status === 'PASSED') return 'green';
    if (status === 'FAILED') return 'red';
    return undefined;
  };

  const onOpenExternal = (e: any) => {
    e.stopPropagation();
    window.electron.ipcRenderer.openExternal(
      `https://nyu.databrary.org/volume/${volumeId}/slot/${session.id}`
    );
  };

  useEffect(() => {
    setErrors(checkSessionName(session || {}));
  }, [session]);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography>{`${session.id || ''} - ${session.name || ''}`}</Typography>
      <Tooltip title="Open Databrary session in Browser">
        <IconButton
          sx={{
            ml: 4,
            p: 0,
          }}
          size="small"
          color="inherit"
          onClick={(e) => onOpenExternal(e)}
        >
          <OpenInNewIcon />
        </IconButton>
      </Tooltip>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          ml: 'auto',
        }}
      >
        <Typography
          sx={{
            mr: 2,
          }}
          color={getStatusColor(status)}
        >
          {status !== 'UNKNOWN' ? status : ''}
        </Typography>

        {errors.length > 0 && (
          <Tooltip
            title={
              <>
                <List>
                  {errors.map((error, idx) => (
                    <ListItem key={idx} sx={{ display: 'list-item' }}>
                      {error}
                    </ListItem>
                  ))}
                </List>
              </>
            }
            placement="top"
          >
            <Chip
              sx={{
                mr: 2,
              }}
              icon={<InfoIcon />}
              size="small"
              color={errors.length ? 'error' : 'primary'}
            />
          </Tooltip>
        )}
        {(Object.values(session.participants) || []).map((participant) => (
          <Tooltip
            key={`participant-${participant.id}`}
            title={
              participant.id
                ? `${TOOLTIP_MESSAGES.DATABRARY_PARTICIPANT} ${participant.id}`
                : TOOLTIP_MESSAGES.DATABRARY_PARTICIPANT_ERROR
            }
            placement="top"
          >
            <Chip
              sx={{
                mr: 2,
              }}
              icon={<FaceIcon />}
              size="small"
              color={participant.id ? 'primary' : 'error'}
              label={participant.id || ''}
            />
          </Tooltip>
        ))}
      </Box>
    </Box>
  );
};

export default SessionSummary;
