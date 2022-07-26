import { useEffect, useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  Divider,
} from '@mui/material';
import { Asset as AssetType, Session as SessionType } from '../../types';
import Asset from './Asset';
import SessionSummary from './SessionSummary';
import SessionActions from './SessionActions';
import { RootState } from '../store/store';
import { useAppSelector } from '../hooks/store';
import { getQAStatus } from '../slices/box';

type Props = {
  session: SessionType;
  volumeId: string;
  volumeName: string;
};

const Session = ({ session, volumeId, volumeName }: Props) => {
  const status = useAppSelector((state: RootState) =>
    getQAStatus(state, session.id)
  );

  const [assetMap, setAssetMap] = useState<Record<number, AssetType>>({});

  useEffect(() => {
    setAssetMap(session.assets || {});
  }, [session]);

  return (
    <Accordion>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel1a-content"
        id="panel1a-header"
        disabled={Object.values(assetMap).length === 0}
      >
        <SessionSummary volumeId={volumeId} status={status} session={session} />
      </AccordionSummary>
      <AccordionDetails>
        <Divider variant="middle" />
        {status === 'UNKNOWN' && Object.values(assetMap).length > 0 && (
          <>
            <SessionActions
              volumeId={volumeId}
              session={session}
              volumeName={volumeName}
            />
            <Divider variant="middle" />
          </>
        )}
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {(Object.values(assetMap) || []).map((asset, idx) => (
            <Asset key={idx} asset={asset} />
          ))}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};

export default Session;
