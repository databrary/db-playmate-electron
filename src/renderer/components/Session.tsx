import { useEffect, useState, SyntheticEvent } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  List,
  Divider,
  Box,
  Tabs,
  Tab,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import {
  Asset as AssetType,
  Entity as EntityType,
  Session as SessionType,
} from '../../types';
import Asset from './Asset';
import SessionSummary from './SessionSummary';
import SessionActions from './SessionActions';
import Entity from './Entity';
import { RootState } from '../store/store';
import { useAppSelector } from '../hooks/store';
import { getQAStatus } from '../slices/box';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      style={{ width: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3, width: '100%', height: '100%' }}>{children}</Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
    sx: {
      pl: 0,
    },
  };
}

type Props = {
  session: SessionType;
  volumeId: string;
  volumeName: string;
};

const Session = ({ session, volumeId, volumeName }: Props) => {
  const status = useAppSelector((state: RootState) =>
    getQAStatus(state, session.id)
  );

  const passed = useAppSelector((state: RootState) => state.box.passed);

  const [value, setValue] = useState(0);
  const [assetMap, setAssetMap] = useState<Record<number, AssetType>>({});

  const { enqueueSnackbar } = useSnackbar();

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

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
        <SessionActions
          volumeId={volumeId}
          session={session}
          volumeName={volumeName}
          disabled={status === 'PASSED' || status === 'FAILED'}
          status={status}
        />
        <Divider variant="middle" />
        <Box
          sx={{
            flexGrow: 1,
            bgcolor: 'background.paper',
            display: 'flex',
            minHeight: 224,
          }}
        >
          <Tabs
            orientation="vertical"
            variant="scrollable"
            value={value}
            onChange={handleChange}
            aria-label="Vertical tabs example"
            sx={{ borderRight: 1, borderColor: 'divider', height: '100%' }}
          >
            <Tab label="Assets" {...a11yProps(0)} />
            <Tab
              label="Trans"
              disabled={status !== 'PASSED'}
              {...a11yProps(1)}
            />
          </Tabs>
          <TabPanel value={value} index={0}>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {(Object.values(assetMap) || []).map((asset, idx) => (
                <Asset key={idx} asset={asset} />
              ))}
            </List>
          </TabPanel>
          <TabPanel value={value} index={1}>
            <Entity
              type="TRA"
              isAssigned={(entity: EntityType) => {
                const { toDo, inProgress, done } = entity;
                if (
                  done.volumes.some((volume) =>
                    volume.name.includes(`${volumeId}_${session.id}`)
                  )
                ) {
                  return {
                    ...entity,
                    status: 'DONE',
                  };
                }

                if (
                  inProgress.volumes.some((volume) =>
                    volume.name.includes(`${volumeId}_${session.id}`)
                  )
                ) {
                  return {
                    ...entity,
                    status: 'INPROGRESS',
                  };
                }

                if (
                  toDo.volumes.some((volume) =>
                    volume.name.includes(`${volumeId}_${session.id}`)
                  )
                ) {
                  return {
                    ...entity,
                    status: 'TODO',
                  };
                }

                return undefined;
              }}
              onAssign={(entity: EntityType) => {
                const passedQaFileId = passed.find((el) =>
                  el.name.includes(`${volumeId}_${session.id}`)
                )?.id;

                if (!passedQaFileId) {
                  enqueueSnackbar(
                    `Cannot find in box the QA file for session ${session.id} to transcriber`,
                    {
                      variant: 'error',
                    }
                  );
                  return;
                }

                window.electron.ipcRenderer
                  .invoke('assign', [
                    {
                      volumeId,
                      sessionId: session.id,
                      type: entity.type,
                      passedQaFileId,
                      entity,
                    },
                  ])
                  .then((response) => {
                    enqueueSnackbar(
                      `Transcriber ${entity.name} assigned to session ${session.id}`,
                      { variant: 'success' }
                    );
                  })
                  .catch((error) => {
                    enqueueSnackbar(
                      `Error assigning session ${session.id} to transcriber`,
                      {
                        variant: 'error',
                      }
                    );
                  });
              }}
            >
              <Typography>
                Please select a transcriber from the following list:
              </Typography>
            </Entity>
          </TabPanel>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default Session;
