import { GenericService } from '../../__Generic/generic.services';
import { ILabTestLog } from './labTestLog.interface';
import { LabTestLog } from './labTestLog.model';

export class LabTestLogService extends GenericService<
  typeof LabTestLog,
  ILabTestLog
> {
  constructor() {
    super(LabTestLog);
  }
}
