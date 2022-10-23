/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/expect-expect */
import path from 'path';
import { Cell, OPF } from '../OPF';
// import { insertCell } from '../services/datavyu-service';

describe('test insert in OPF', () => {
  // it('should stream the OPF file and update the column with the new code', () => {
  //   insertCell(path.resolve('src', '__tests__', 'test.opf'), 'PLAY_ID', [
  //     'PLAY_244',
  //     '08/21/2022',
  //     '08/21/2022',
  //     's',
  //     '.',
  //   ]);
  // });

  it('should load OPF FIle and read it content', () => {
    const opf = OPF.readOPF(path.resolve('src', '__tests__', 'test_read.opf'));
    console.log('OPF', opf.toString());
    console.log('PLAY Column', opf.column('play_id').toString());
    opf
      .column('play_id')
      .addCell(
        new Cell(
          '00:00:00:111',
          '00:00:00:222',
          `(PLAY_899_43530,03/10/2018,03/06/2020,e,.)`
        )
      );
    console.log('PLAY add column', opf.column('play_id').cell(1).onset);
    console.log('PLAY add column', opf.column('play_id').cell(1).offset);
    OPF.writeOPF(path.resolve('src', '__tests__', 'test_write.opf'), opf);
  });
});
