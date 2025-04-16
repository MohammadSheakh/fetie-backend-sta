import { GenericController } from "../../__Generic/generic.controller";
import { IUserSubscription } from "./userSubscription.interface";
import { UserSubscription } from "./userSubscription.model";
import {  UserSubscriptionService } from "./userSubscription.service";

export class UserSubscriptionController extends GenericController<typeof UserSubscription, IUserSubscription> {
    constructor(){
        super(new UserSubscriptionService(), "Subscription")
    }

    // add more methods here if needed or override the existing ones
}