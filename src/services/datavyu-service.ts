import Zip from 'adm-zip';

const findColumnIdx = (contentList: string[], columnName: string): number => {
  return contentList.findIndex((content) =>
    content.toLowerCase().startsWith(columnName.toLowerCase())
  );
};

const buildCell = (cellCodes: string[]) => {
  return `00:00:00:000,00:00:00:000,(${cellCodes.join(',')})`;
};

const insertCell = (
  filePath: string,
  columnName: string,
  cellCodes: string[]
) => {
  const zip = new Zip(filePath);
  const db = zip.getEntry('db');
  const contentList = zip.readAsText(db).split(/\r?\n/);
  const idxToChange = findColumnIdx(contentList, columnName) + 1;
  contentList[idxToChange] = buildCell(cellCodes);
  const newDB = contentList.join('\r\n');
  zip.updateFile(db, Buffer.from(newDB, 'utf-8'));
  zip.writeZip(filePath);
};

export { insertCell };
