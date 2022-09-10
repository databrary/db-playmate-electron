import { Chip, Typography, Box, Tooltip } from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import { Participant } from '../../types';
import { QA, TOOLTIP_MESSAGES } from '../../constants';

type Props = {
  id: string;
  participants: Participant[];
  status?: QA;
};

const SessionSummary = ({ id, participants, status = 'UNKNOWN' }: Props) => {
  const getStatusColor = (status: QA) => {
    if (status === 'PASSED') return 'green';
    if (status === 'FAILED') return 'red';
    return undefined;
  };

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Typography>{id || ''}</Typography>
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
        {participants.map((participant) => (
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
