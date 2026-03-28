import { registerAuthIpc } from './auth.ipc'
import { registerCustomersIpc } from './customers.ipc'
import { registerPartsIpc } from './parts.ipc'
import { registerJobsIpc } from './jobs.ipc'
import { registerPurchaseIpc } from './purchase.ipc'
import { registerReportsIpc } from './reports.ipc'
import { registerSettingsIpc } from './settings.ipc'
import { registerExpensesIpc } from './expenses.ipc'
import { registerTemplatesIpc } from './job-templates.ipc'
import { registerSuppliersIpc } from './suppliers.ipc'
import { registerSearchIpc } from './search.ipc'
import { registerPosIpc } from './pos.ipc'

export function registerAllIpc() {
  registerAuthIpc()
  registerCustomersIpc()
  registerPartsIpc()
  registerJobsIpc()
  registerPurchaseIpc()
  registerReportsIpc()
  registerSettingsIpc()
  registerExpensesIpc()
  registerTemplatesIpc()
  registerSuppliersIpc()
  registerSearchIpc()
  registerPosIpc()
}
