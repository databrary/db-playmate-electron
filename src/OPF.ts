/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable max-classes-per-file */
import Zip, { IZipEntry } from 'adm-zip';
import path from 'path';

const DEFAULT_ONSET = '00:00:00:000';
const DEFAULT_OFFSET = '00:00:00:000';
const DEFAULT_VALUE = '()';

export class Cell {
  private _onset: string;

  private _offset: string;

  private _value: string;

  constructor(
    value = DEFAULT_VALUE,
    onset = DEFAULT_ONSET,
    offset = DEFAULT_OFFSET
  ) {
    this._onset = onset;
    this._offset = offset;
    this._value = value;
  }

  public get onset() {
    return this._onset;
  }

  public set onset(newOnset: string) {
    this._onset = newOnset;
  }

  public get offset() {
    return this._offset;
  }

  public set offset(newOffset: string) {
    this._offset = newOffset;
  }

  public get value() {
    return this._value;
  }

  public toString = (): string => {
    return `${this.onset},${this.offset},${this.value}`;
  };
}

export class Column {
  private _name: string;

  private _codes: string[];

  private _columnType: string;

  private _cells: Cell[] = [];

  constructor(name: string, codes: string, cells: Cell[] = []) {
    this._name = name;
    this._columnType = codes.split('-')[0];
    this._codes = codes.split('-')[1].split(',');
    this._cells = cells;
  }

  public get name() {
    return this._name;
  }

  public get codes() {
    return this._codes;
  }

  public get cells() {
    return this._cells;
  }

  public set cells(newCells: Cell[]) {
    this._cells = newCells;
  }

  public cell = (cellIndex: number): Cell => {
    return this._cells[cellIndex];
  };

  public addCell = (cell: Cell) => {
    this._cells.push(cell);
  };

  public addCells = (cells: Cell[]) => {
    this._cells.push(cells);
  };

  public toString = (): string => {
    const str: string[] = [
      `${this.name} ${this._columnType}-${this.codes.join(',')}`,
    ];
    str.push(...this.cells.map((cell) => cell.toString()));

    return str.join('\r\n');
  };
}

export class OPF {
  private _columns: Record<string, Column> = {};

  private _project: string;

  private _name: string;

  private static getColumns = (dbContent: string[]): Column[] => {
    const columns: Column[] = [];
    // eslint-disable-next-line no-undef-init
    let currColumn: Column | undefined = undefined;
    for (const content of dbContent) {
      // Ignore db version
      if (content.startsWith('#')) continue;

      if (this.isColumn(content) && !currColumn) {
        const [columnName, colDef] = content.split(' ');
        currColumn = new Column(columnName, colDef);
      } else if (this.isColumn(content) && currColumn) {
        columns.push(currColumn); // Save the current column
        const [columnName, colDef] = content.split(' ');
        currColumn = new Column(columnName, colDef);
      } else if (
        !this.isColumn(content) &&
        currColumn &&
        content.split(',').length >= 3
      ) {
        const [onset, offset, ...rest] = content.split(',');
        const values = rest ? `${rest.join(',')}` : DEFAULT_VALUE;

        currColumn.addCell(new Cell(values, onset, offset));
      } else {
        console.log('Cell Not recorded', content);
      }
    }

    if (currColumn) columns.push(currColumn);

    return columns;
  };

  private static getName = (filePath: string) => {
    return path.basename(filePath).split('.')[0];
  };

  static readOPF = (filePath: string) => {
    const zip = new Zip(filePath);
    const db: IZipEntry | null = zip.getEntry('db');

    if (!db) throw new Error('Cannot find db file in the OPF file');
    const contentList = zip.readAsText(db).split(/\r?\n/);

    const project: IZipEntry | null = zip.getEntry('project');
    let projectContent = '';
    if (project) {
      projectContent = zip.readAsText(project);
    }

    return new OPF(
      OPF.getName(filePath),
      OPF.getColumns(contentList),
      projectContent
    );
  };

  static writeOPF = (filePath: string, opf: OPF) => {
    const zip = new Zip();
    zip.addFile(
      `db`,
      Buffer.from(
        `#4\r\n${opf.db.map((col) => col.toString()).join('\r\n')}`,
        'utf-8'
      )
    );
    zip.addFile(`project`, Buffer.from(opf.project, 'utf-8'));
    zip.writeZip(filePath);
  };

  private constructor(name: string, columns: Column[], project: string) {
    this._columns = columns.reduce(
      (a, v) => ({ ...a, [v.name.toLowerCase()]: v }),
      {}
    );
    this._project = project;
    this._name = name;
  }

  static isColumn = (str: string): boolean => {
    return str.split(' ').length > 1 && str.includes('|') && str.includes('-');
  };

  public get db() {
    return Object.values(this._columns);
  }

  public get name() {
    return this._name;
  }

  public get project() {
    return this._project;
  }

  public column = (name: string): Column => {
    const response = this._columns[name.toLocaleLowerCase()];

    if (!response)
      throw Error(`Cannot find column ${name} in OPF ${this.name} File`);

    return response;
  };

  public clearColumn = (name: string): Column => {
    const columnToClear = this.column(name);
    columnToClear.cells = [];
    return columnToClear;
  };

  public addColumn = (name: string, column: Column) => {
    if (name in this._columns)
      throw Error(`Column ${name} already exists in the OPF ${this.name} file`);

    this._columns[name] = column;
  };

  public removeColumn = (name: string): Column => {
    const columnToRemove = this.column(name);

    delete this._columns[name];

    return columnToRemove;
  };

  public toString = (): string => {
    const str: string[] = [];
    str.push(...Object.values(this._columns).map((col) => col.toString()));

    return str.join('\r\n');
  };
}
