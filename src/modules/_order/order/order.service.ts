import { GenericService } from "../../__Generic/generic.services";
import { IOrder } from "./order.interface";
import { Order } from "./order.model";

export class OrderService extends GenericService<typeof Order, IOrder>{
    constructor(){
        super(Order)
    }
}