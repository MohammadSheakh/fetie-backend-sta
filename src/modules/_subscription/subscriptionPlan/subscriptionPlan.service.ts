import { GenericService } from "../../__Generic/generic.services";
import { ISubscriptionPlan } from "./subscriptionPlan.interface";
import { SubscriptionPlan } from "./subscriptionPlan.model";

export class SubscriptionPlanService extends GenericService<typeof SubscriptionPlan, ISubscriptionPlan>{
    constructor(){
        super(SubscriptionPlan)
    }

    getBySubscriptionType = async (subscriptionType: string) => {
        return await this.model.findOne({ subscriptionType });
    }
}