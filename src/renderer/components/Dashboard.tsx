import { useState } from 'react';
import { Accordion, Spinner } from 'react-bootstrap';
import Volume from './Volume';

const Dashboard = () => {
  const [volumeList, setVolumeList] = useState(['899']);

  // if (isFetching) return <Spinner animation="border" />;

  return (
    <Accordion defaultActiveKey="0">
      {(volumeList || []).map((volumeId, idx) => (
        <Volume key={volumeId} volumeId={volumeId} eventkey={`${idx}`} />
      ))}
    </Accordion>
  );
};

export default Dashboard;
