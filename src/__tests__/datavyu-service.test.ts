import path from 'path';
import { insertCell } from '../services/datavyu-service';

describe('test insert in OPF', () => {
  it('should stream the OPF file and update the column with the new code', () => {
    insertCell(path.resolve('src', '__tests__', 'test.opf'), 'PLAY_ID', [
      'PLAY_244',
      '08/21/2022',
      '08/21/2022',
      's',
      '.',
    ]);
  });
});
