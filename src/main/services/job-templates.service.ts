import { getDb, getSqlite } from '../db/connection'
import { jobTemplates, jobTemplateParts, parts } from '../db/schema'
import { eq, asc } from 'drizzle-orm'

interface TemplatePartInput {
  partId: number
  quantity: number
}

interface TemplateInput {
  name: string
  description?: string
  repairFee: number
  workerMarkup: number
  notes?: string
  parts: TemplatePartInput[]
}

export const jobTemplatesService = {
  getAll() {
    const db = getDb()
    const templates = db.select().from(jobTemplates).orderBy(asc(jobTemplates.name)).all()
    return templates.map((t) => {
      const partCount = db
        .select()
        .from(jobTemplateParts)
        .where(eq(jobTemplateParts.templateId, t.id))
        .all().length
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        repairFee: t.repairFee,
        workerMarkup: t.workerMarkup,
        partCount
      }
    })
  },

  getById(id: number) {
    const db = getDb()
    const template = db.select().from(jobTemplates).where(eq(jobTemplates.id, id)).get()
    if (!template) return null

    const templateParts = db
      .select()
      .from(jobTemplateParts)
      .where(eq(jobTemplateParts.templateId, id))
      .all()

    const partsWithDetails = templateParts.map((tp) => {
      const part = db.select().from(parts).where(eq(parts.id, tp.partId)).get()
      return {
        partId: tp.partId,
        quantity: tp.quantity,
        partName: part?.name || 'Unknown',
        buyPrice: part?.buyPrice || 0,
        sellPrice: part?.sellPrice || 0,
        stock: part?.quantity || 0
      }
    })

    return {
      ...template,
      parts: partsWithDetails
    }
  },

  create(data: TemplateInput) {
    const sqlite = getSqlite()
    const db = getDb()

    const txn = sqlite.transaction(() => {
      const template = db
        .insert(jobTemplates)
        .values({
          name: data.name,
          description: data.description,
          repairFee: data.repairFee,
          workerMarkup: data.workerMarkup,
          notes: data.notes
        })
        .returning()
        .get()

      for (const p of data.parts) {
        db.insert(jobTemplateParts)
          .values({
            templateId: template.id,
            partId: p.partId,
            quantity: p.quantity
          })
          .run()
      }

      return template
    })

    return txn()
  },

  update(id: number, data: TemplateInput) {
    const sqlite = getSqlite()
    const db = getDb()

    const txn = sqlite.transaction(() => {
      db.update(jobTemplates)
        .set({
          name: data.name,
          description: data.description,
          repairFee: data.repairFee,
          workerMarkup: data.workerMarkup,
          notes: data.notes,
          updatedAt: new Date().toISOString()
        })
        .where(eq(jobTemplates.id, id))
        .run()

      // Delete old parts and insert new ones
      db.delete(jobTemplateParts).where(eq(jobTemplateParts.templateId, id)).run()

      for (const p of data.parts) {
        db.insert(jobTemplateParts)
          .values({
            templateId: id,
            partId: p.partId,
            quantity: p.quantity
          })
          .run()
      }

      return db.select().from(jobTemplates).where(eq(jobTemplates.id, id)).get()
    })

    return txn()
  },

  delete(id: number) {
    const sqlite = getSqlite()
    const db = getDb()

    const txn = sqlite.transaction(() => {
      db.delete(jobTemplateParts).where(eq(jobTemplateParts.templateId, id)).run()
      db.delete(jobTemplates).where(eq(jobTemplates.id, id)).run()
    })

    txn()
  }
}
