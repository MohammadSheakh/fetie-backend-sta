import { GenericService } from "../__Generic/generic.services";
import { IDailyCycleInsights, TDailyCycleInsights } from "./dailyCycleInsights.interface";
import { DailyCycleInsights  } from "./dailyCycleInsights.model";

export class DailyCycleInsightsService extends GenericService<typeof DailyCycleInsights, IDailyCycleInsights>{
    constructor(){
        super(DailyCycleInsights)
    }

    //[🚧][🧑‍💻✅][🧪] // 🆗
    createByDateAndUserId = async (data: Partial<TDailyCycleInsights>) => {
        
        const res = await this.model.create(data);
        if (!res) {
            throw new Error('Database error while creating Daily Cycle Insights');
        }
        return res;
    }

    updateByDateAndUserId = async (data: Partial<TDailyCycleInsights>) => {
        const { date, userId } = data;
        const res = await this.model.findOneAndUpdate(
            { date, userId },
            { $set: data },
            { new: true }
        );
        if (!res) {
            throw new Error('Failed to update Daily Cycle Insights');
        }
        return res;
    }

    // get by date and userId 🔥`eta develop korte hobe .. 

    getByDateAndUserId = async (date: Date, userId: string) => {
        const res = await this.model.findOne({ date, userId });
        // if (!res) {
        //     throw new Error('Database error while getting Daily Cycle Insights By date And userId');
        // }
        return res;
    }

    // Add more service here ..
}