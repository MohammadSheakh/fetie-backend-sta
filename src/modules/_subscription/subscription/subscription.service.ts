import { GenericService } from "../../__Generic/generic.services";
import { ISubscription } from "./subscription.interface";
import { Subscription } from "./subscription.model";

export class SubscriptionService extends GenericService<typeof Subscription, ISubscription>{
    constructor(){
        super(Subscription)
    }

    getBySubscriptionType = async (subscriptionType: string) => {
        return await this.model.findOne({ subscriptionType });
    }
}