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
import { Entity as EntityType, Study, StudyStatus } from '../../types';
import { useAppSelector } from '../hooks/store';
import { RootState } from '../store/store';

type EntityStatus = {
  status?: StudyStatus;
};

type EntityProps = {
  type: Study;
  onAssign: (entity: EntityType) => void;
  isAssigned: (entity: EntityType) => (EntityType & EntityStatus) | undefined;
  children: ReactNode | undefined;
};

const Entity = ({
  type,
  onAssign,
  isAssigned,
  children = undefined,
}: EntityProps) => {
  const enitityList: EntityType[] = useAppSelector(
    (state: RootState) => state.box.studyProgress[type] || []
  );

  const [selected, setSelected] = useState<string>('');

  const [selectedEntity, setSelectedEntity] = useState<
    EntityType & EntityStatus
  >();

  const findSelectedEntity = (name: string) => {
    return (enitityList || []).find((t) => t.name === name);
  };

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedEntity(findSelectedEntity(event.target.value));
  };

  useEffect(() => {
    let found: (EntityType & EntityStatus) | undefined;
    enitityList.forEach((entity) => {
      const result = isAssigned(entity);

      if (!found && result) {
        found = result;
      }

      return false;
    });

    setSelectedEntity(found);
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
      <Button onClick={onClick} variant="contained" sx={{ mt: 'auto' }}>
        Assign
      </Button>
    </FormControl>
  );
};

export default Entity;
