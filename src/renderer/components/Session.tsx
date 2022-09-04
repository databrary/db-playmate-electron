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

type Props = {
  session: SessionType;
  volumeId: string;
};

const Session = ({ session, volumeId }: Props) => {
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
      >
        <SessionSummary
          id={session.id}
          participants={Object.values(session.participants) || []}
        />
      </AccordionSummary>
      <AccordionDetails>
        <Divider variant="middle" />
        <SessionActions volumeId={volumeId || 'VOL'} session={session} />
        <Divider variant="middle" />

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
