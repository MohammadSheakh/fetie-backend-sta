import { StatusCodes } from 'http-status-codes';
import { Demo } from './demo.model';
import { IDemo } from './demo.interface';
import { GenericService } from '../__Generic/generic.services';


export class DemoService extends GenericService<
  typeof Demo,
  IDemo
> {
  constructor() {
    super(Demo);
  }
}
