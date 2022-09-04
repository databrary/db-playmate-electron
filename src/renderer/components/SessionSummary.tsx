import { Chip, Typography, Box } from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import { Participant } from '../../types';

type Props = {
  id: string;
  participants: Participant[];
};

const SessionSummary = ({ id, participants }: Props) => {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
      }}
    >
      <Typography>{id || ''}</Typography>
      {participants.map((participant) => (
        <Chip
          sx={{
            mr: 2,
          }}
          icon={<FaceIcon />}
          size="small"
          color="primary"
          label={participant.id || ''}
        />
      ))}
    </Box>
  );
};

export default SessionSummary;
