import { GenericService } from "../__Generic/generic.services";
import { IDailyCycleInsights } from "./dailyCycleInsights.interface";
import { DailyCycleInsights  } from "./dailyCycleInsights.model";

export class DailyCycleInsightsService extends GenericService<typeof DailyCycleInsights, IDailyCycleInsights>{
    constructor(){
        super(DailyCycleInsights)
    }

    createByDateAndUserId = async (date: string, userId: string) => {
        
    }

    // Add more service here ..
}