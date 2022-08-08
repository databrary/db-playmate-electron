import { ReactNode } from 'react';

type Props = {
  label: string;
  children?: ReactNode;
};

const AccordionHeader = ({ label, children = undefined }: Props) => {
  return (
    <div className="d-flex justify-content-between align-items-center w-100">
      <div className="me-auto">{label}</div>
      {children}
    </div>
  );
};

export default AccordionHeader;
