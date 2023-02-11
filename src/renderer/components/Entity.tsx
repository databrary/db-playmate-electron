import {
  Button,
  FormControl,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import {
  Entity as EntityType,
  Session as SessionType,
  Study,
  StudyStatus,
} from '../../types';

import { useAppSelector } from '../hooks/store';
import { RootState } from '../store/store';

type EntityStatus = {
  status?: StudyStatus;
};

type EntityProps = {
  type: Study;
  session: SessionType;
  volumeId: string;
  passedQaFileId: number | undefined;
  children: ReactNode | undefined;
};

const Entity = ({
  type,
  session,
  volumeId,
  passedQaFileId = undefined,
  children = undefined,
}: EntityProps) => {
  const enitityList: EntityType[] = useAppSelector(
    (state: RootState) => state.box.studyProgress[type] || []
  );

  const [selected, setSelected] = useState<string>('');
  const [dirty, setDirty] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const [selectedEntity, setSelectedEntity] = useState<
    EntityType & EntityStatus
  >();

  const findSelectedEntity = (name: string) => {
    return (enitityList || []).find((t) => t.name === name);
  };

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedEntity(findSelectedEntity(event.target.value));
  };

  const isAssigned = (entity: EntityType) => {
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
  };

  const onAssign = (entity: EntityType) => {
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
        setDirty(true);
      })
      .catch((error) => {
        enqueueSnackbar(
          `Error assigning session ${session.id} to transcriber`,
          {
            variant: 'error',
          }
        );
      });
  };

  const isSessionAssigned = (enitityList: EntityType[]) => {
    let found: EntityType & EntityStatus;

    enitityList.forEach((entity) => {
      const result = isAssigned(entity);

      if (!found && result) {
        found = result;
      }

      return false;
    });

    return found;
  };

  useEffect(() => {
    setSelectedEntity(isSessionAssigned(enitityList));
  }, [enitityList]);

  useEffect(() => {
    if (!selectedEntity) setSelected('');
    else setSelected(selectedEntity.name);
  }, [selectedEntity]);

  const onClick = () => {
    if (!selectedEntity) return;

    if (onAssign && selectedEntity) {
      try {
        onAssign(selectedEntity);
      } catch (error) {
        console.log('Error assigning', error);
        setSelectedEntity(undefined);
      }
    }
  };

  return (
    <FormControl
      sx={{
        width: '100%',
        height: '100%',
      }}
      variant="standard"
      size="small"
    >
      {children}
      <Select
        labelId="select-helper-label"
        id="select-helper"
        value={selected}
        onChange={handleChange}
        sx={{ my: 'auto' }}
        disabled={!!isSessionAssigned(enitityList) || dirty}
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {(enitityList || []).map((entity) => (
          <MenuItem key={entity.name} value={entity.name}>
            <ListItemText primary={entity.name} />
          </MenuItem>
        ))}
      </Select>
      <Typography>Status: {selectedEntity?.status}</Typography>
      <Button
        disabled={!!isSessionAssigned(enitityList) || dirty}
        onClick={onClick}
        variant="contained"
        sx={{ mt: 'auto' }}
      >
        Assign
      </Button>
    </FormControl>
  );
};

export default Entity;
