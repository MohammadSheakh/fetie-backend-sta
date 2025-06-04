import { HelpMessage } from './helpMessage.model';
import { IHelpMessage } from './helpMessage.interface';
import { GenericService } from '../__Generic/generic.services';

export class HelpMessageService extends GenericService<
  typeof HelpMessage,
  IHelpMessage
> {
  constructor() {
    super(HelpMessage);
  }

}
