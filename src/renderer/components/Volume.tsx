import { useEffect, useState } from 'react';
import { Typography, Divider } from '@mui/material';
import { Volume as VolumeType, Session as SessionType } from '../../types';
import Session from './Session';
import { useAppSelector } from '../hooks/store';

type Props = {
  volumeId: string;
};

const Volume = ({ volumeId }: Props) => {
  const volumes = useAppSelector((state) => state.databrary.volumes);
  const [sessionsMap, setSessionsMap] = useState<Record<string, SessionType>>(
    {}
  );
  const [volumeName, setVolumeName] = useState<string>('');

  const getVolumeLabel = () => {
    return `Volume ${volumeId} ${volumeName ? `- ${volumeName}` : ``}`;
  };

  useEffect(() => {
    setSessionsMap((volumes[volumeId] as VolumeType)?.sessions || {});
    setVolumeName((volumes[volumeId] as VolumeType)?.name || '');
  }, [volumes, volumeId]);

  return (
    <>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 'bold',
        }}
      >
        {getVolumeLabel()}
      </Typography>
      <Divider
        sx={{
          mt: 2,
          mb: 4,
        }}
        variant="middle"
      />
      {(Object.values(sessionsMap) || []).map((session) => {
        return (
          <Session
            key={session.id}
            session={session}
            volumeId={volumeId}
            volumeName={volumeName}
          />
        );
      })}
    </>
  );
};

export default Volume;
