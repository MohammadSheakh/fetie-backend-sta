import cron from 'node-cron';

class CronService {
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Schedule a new cron job
   * @param name - Name identifier for the job
   * @param schedule - Cron schedule expression (e.g., '0 0 * * *' for daily at midnight)
   * @param task - Function to execute when the job runs
   */
  public schedule(name: string, schedule: string, additionalMessage :string, task: () => void): void {
    if (this.jobs.has(name)) {
      console.log(`Cron job '${name}' already exists. Stopping and replacing.`);
      this.stop(name);
    }

    const job = cron.schedule(schedule, task, {
      scheduled: true,
      timezone: 'UTC' // Adjust timezone as needed
    });

    this.jobs.set(name, job);
    console.log(`Cron job '${name}' scheduled with pattern: ${schedule} || ${additionalMessage}`);
  }

   /**
   * Stop a specific cron job
   * @param name - Name of the cron job to stop
   */
  public stop(name: string): void {
    const job = this.jobs.get(name);
    if (job) {
      job.stop();
      this.jobs.delete(name);
      console.log(`Cron job '${name}' stopped`);
    }
  }

  /**
   * Stop all cron jobs
   */
  public stopAll(): void {
    this.jobs.forEach((job, name) => {
      job.stop();
      console.log(`Cron job '${name}' stopped`);
    });
    this.jobs.clear();
  }


}

export const cronService = new CronService();