/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-destructuring */
/* eslint-disable max-classes-per-file */
import Zip from 'adm-zip';

const DEFAULT_ONSET = '00:00:00:000';
const DEFAULT_OFFSET = '00:00:00:000';
const DEFAULT_VALUE = '';

export class Cell {
  _onset: string;

  _offset: string;

  _value: string;

  constructor(onset: string, offset: string, value: string) {
    this._onset = onset;
    this._offset = offset;
    this._value = value;
  }

  public get onset() {
    return this._onset;
  }

  public get offset() {
    return this._offset;
  }

  public get value() {
    return this._value;
  }

  public toString = (): string => {
    return `${this.onset},${this.offset},(${this.value})`;
  };
}

export class Column {
  _name: string;

  _codes: string;

  _cells: Cell[] = [];

  constructor(name: string, codes: string, cells: Cell[] = []) {
    this._name = name;
    this._codes = codes;
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

  public addCell = (cell: Cell) => {
    this._cells.push(cell);
  };

  public toString = (): string => {
    const str: string[] = [`${this.name} ${this.codes}`];
    str.push(...this.cells.map((cell) => cell.toString()));

    return str.join('\r\n');
  };

  // buildCelles = (cells: string[]) => {
  //   const cellList: Cell[] = [];
  //   for (const cell of cells) {
  //     const [onset, offset, ...rest] = cell.split(',');
  //     cellList.push(new Cell(onset, offset, rest.join(',')));
  //   }
  //   return cellList;
  // };
}

export class OPF {
  _columns: Record<string, Column> = {};

  static readOPF = (filePath: string) => {
    const zip = new Zip(filePath);
    const db: Zip.IZipEntry | null = zip.getEntry('db');

    if (!db) throw new Error('Cannot find db file in the OPF file');
    const columns: Column[] = [];
    const contentList = zip.readAsText(db).split(/\r?\n/);
    // eslint-disable-next-line no-undef-init
    let currColumn: Column | undefined = undefined;
    for (const content of contentList) {
      // Ignore db version
      if (content.startsWith('#')) continue;

      if (this.isColumn(content) && !currColumn) {
        const [columnNmae, colDef] = content.split(' ');
        currColumn = new Column(columnNmae, colDef);
      } else if (this.isColumn(content) && currColumn) {
        columns.push(currColumn); // Save the current column
        const [columnNmae, colDef] = content.split(' ');
        currColumn = new Column(columnNmae, colDef);
      } else if (!this.isColumn(content) && currColumn) {
        const [onset, offset, ...rest] = content.split(',');
        currColumn.addCell(
          new Cell(
            onset || DEFAULT_ONSET,
            offset || DEFAULT_OFFSET,
            rest.join(',') || DEFAULT_VALUE
          )
        );
      } else {
        console.log('Cell', content);
      }
    }

    return new OPF(columns);
  };

  static writeOPF = (filePath: string, opf: OPF) => {
    const zip = new Zip();
    zip.addFile('db', Buffer.from(opf.toString(), 'utf-8'));
    zip.writeZip(filePath);
  };

  private constructor(columns: Column[]) {
    this._columns = columns.reduce((a, v) => ({ ...a, [v.name]: v }), {});
  }

  static isColumn = (str: string): boolean => {
    return str.split(' ').length > 1;
  };

  public get columns() {
    return this._columns;
  }

  public toString = (): string => {
    const str: string[] = [];
    str.push(...Object.values(this.columns).map((col) => col.toString()));

    return str.join('\r\n');
  };

  // buildColumns = (entry: Zip.IZipEntry): Record<string, Column> => {
  //   const contentList = this.zip.readAsText(entry).split(/\r?\n/);
  //   const columns: Record<string, Column> = {};
  //   let currentColumn: string | null = null;
  //   let currentCodes: string | null = null;
  //   let cells: string[] = [];
  //   for (const content of contentList) {
  //     if (this.isColumn(content) && currentColumn == null) {
  //       currentColumn = content.split(' ')[0];
  //       currentCodes = content.split(' ')[1];
  //       cells = [];
  //     } else if (
  //       this.isColumn(content) &&
  //       currentColumn !== null &&
  //       currentCodes !== null &&
  //       content.split(' ')[0] !== currentColumn
  //     ) {
  //       columns[currentColumn] = new Column(currentColumn, currentCodes, cells);
  //       currentColumn = content.split(' ')[0];
  //       currentCodes = content.split(' ')[1];
  //       cells = [];
  //     } else {
  //       cells.push(content);
  //     }
  //   }
  //   return columns;
  // };
}
