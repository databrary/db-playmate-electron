/* eslint-disable jest/no-disabled-tests */
/* eslint-disable jest/expect-expect */
import path from 'path';
import { OPF } from '../OPF';
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
    const opf = OPF.readOPF(path.resolve('src', '__test__', 'test_read.opf'));
    console.log('OPF', opf.toString());
  });
});
