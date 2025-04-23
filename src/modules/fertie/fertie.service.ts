import { GenericService } from "../__Generic/generic.services";
import { IFertie } from "./fertie.interface";
import { Fertie } from "./fertie.model";

export class FertieService extends GenericService<typeof Fertie, IFertie>{
    constructor(){
        super(Fertie)
    }

    //[🚧][🧑‍💻✅][🧪] // 🆗
    
    // Add more service here ..
}