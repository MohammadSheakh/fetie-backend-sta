import { GenericService } from "../__Generic/generic.services";
import { ISuplifyPartner } from "./suplifyPartner.interface";
import { SuplifyPartner } from "./suplifyPartner.model";

export class SuplifyPartnerService extends GenericService<typeof SuplifyPartner, ISuplifyPartner> {
    constructor() {
        super(SuplifyPartner);
    }
}