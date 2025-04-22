import { GenericService } from "../../__Generic/generic.services";
import { IPregnancyHistory } from "../pregnancyHistory/pregnancyHistory.interface";
import { PregnancyHistory } from "../pregnancyHistory/pregnancyHistory.model";

export class PregnancyHistoryService extends GenericService<typeof PregnancyHistory , IPregnancyHistory>{
    constructor(){
        super(PregnancyHistory)
    }
}