import { StatusCodes } from 'http-status-codes';
import { GenericService } from '../__Generic/generic.services';
import { ILab } from './lab.interface';
import { Lab } from './lab.model';

export class LabService extends GenericService<
  typeof Lab,
  ILab
> {
  constructor() {
    super(Lab);
  }
}
