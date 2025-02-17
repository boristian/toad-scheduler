import { Job, JobStatus } from '../../common/Job'
import { Task } from '../../common/Task'
import { AsyncTask } from '../../common/AsyncTask'
import { JobOptions } from '../simple-interval/SimpleIntervalJob'

export const CRON_EVERY_SECOND = '* * * * * *'

export const CRON_EVERY_30_SECONDS = '*/30 * * * * *'

export const CRON_EVERY_MINUTE = '* * * * *'

export const CRON_EVERY_30_MINUTES = '*/30 * * * *'

export const CRON_EVERY_HOUR = '0 * * * *'

export type CronSchedule = {
  cronExpression: string
  timezone?: string
}

export type Cron = {
  isRunning(): boolean
  stop(): void
}

export class CronJob extends Job {
  private readonly schedule: CronSchedule
  private readonly task: Task | AsyncTask
  private readonly preventOverrun: boolean

  private cronInstance: Cron | undefined

  constructor(schedule: CronSchedule, task: Task | AsyncTask, options: JobOptions = {}) {
    super(options.id)
    this.preventOverrun = false
    this.schedule = schedule
    this.task = task
  }

  /* istanbul ignore next */
  getStatus(): JobStatus {
    return this.cronInstance?.isRunning() ? JobStatus.RUNNING : JobStatus.STOPPED
  }

  start(): void {
    // lazy-require croner to avoid mandatory dependency
    let croner
    try {
      croner = require('croner')
    } catch (err) {
      /* istanbul ignore next */
      throw new Error(
        'Please install "croner" (run "npm i croner") in case you want to use Cron jobs.'
      )
    }

    this.cronInstance = croner.Cron(
      this.schedule.cronExpression,
      {
        timezone: this.schedule.timezone,
      },
      () => {
        if (!this.task.isExecuting || !this.preventOverrun) {
          this.task.execute(this.id)
        }
      }
    )
  }

  /* istanbul ignore next */
  stop(): void {
    this.cronInstance?.stop()
  }
}
