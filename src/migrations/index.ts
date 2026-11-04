import * as migration_20261104_101654_initial from './20261104_101654_initial';
import * as migration_20261104_104756_data_model from './20261104_104756_data_model';

export const migrations = [
  {
    up: migration_20261104_101654_initial.up,
    down: migration_20261104_101654_initial.down,
    name: '20261104_101654_initial',
  },
  {
    up: migration_20261104_104756_data_model.up,
    down: migration_20261104_104756_data_model.down,
    name: '20261104_104756_data_model'
  },
];
