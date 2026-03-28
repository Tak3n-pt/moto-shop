import { ipcMain } from 'electron'
import { searchService } from '../services/search.service'

export function registerSearchIpc() {
  ipcMain.handle('search:global', async (_event, query: string) => {
    try {
      return { success: true, data: searchService.globalSearch(query) }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
