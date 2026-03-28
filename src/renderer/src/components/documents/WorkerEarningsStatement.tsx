import { useTranslation } from 'react-i18next'
import DocumentLayout from './DocumentLayout'
import { formatDZD, formatDate } from '../../lib/utils'
import type { WorkerEarningsStatementProps } from './types'

export default function WorkerEarningsStatement({
  worker,
  dateRange,
  jobs,
  totalEarnings,
  totalJobs,
}: WorkerEarningsStatementProps) {
  const { t } = useTranslation()

  const title = t('documents.workerStatement.title', 'WORKER EARNINGS STATEMENT')
  const periodLabel = `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}`

  const totalRepairFees = jobs.reduce((sum, job) => sum + job.repairFee, 0)

  return (
    <DocumentLayout title={title}>
      {/* Worker name */}
      <div style={{ textAlign: 'center', marginBottom: 4, fontSize: 18, fontWeight: 700, color: '#000' }}>
        {worker.displayName}
      </div>

      {/* Period */}
      <div style={{ textAlign: 'center', marginBottom: 24, fontSize: 12, color: '#555' }}>
        {t('documents.period', 'Period')}: <strong>{periodLabel}</strong>
      </div>

      {/* EARNINGS SUMMARY */}
      <div style={{ border: '1px solid #ccc', borderRadius: 6, padding: '14px 16px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', marginBottom: 12 }}>
          {t('documents.workerStatement.earningsSummary', 'EARNINGS SUMMARY')}
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {/* Jobs completed */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '10px 14px', textAlign: 'center', background: '#f9fafb' }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>
              {t('documents.workerStatement.totalJobs', 'Total Jobs Completed')}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#000' }}>{totalJobs}</div>
          </div>

          {/* Repair fees charged */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, padding: '10px 14px', textAlign: 'center', background: '#f9fafb' }}>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', marginBottom: 4 }}>
              {t('documents.workerStatement.totalRepairFees', 'Total Repair Fees Charged')}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#000' }}>{formatDZD(totalRepairFees)}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {t('documents.workerStatement.repairFeesNote', 'What customers paid for labor')}
            </div>
          </div>
        </div>

        {/* Main highlight — your share */}
        <div style={{
          border: '2px solid #16a34a',
          borderRadius: 6,
          padding: '14px 18px',
          background: '#f0fdf4',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            {t('documents.workerStatement.yourShare', 'Your Share (30%)')}
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#16a34a', lineHeight: 1.1 }}>
            {formatDZD(totalEarnings)}
          </div>
        </div>

        {/* Explanation note */}
        <div style={{ fontSize: 11, color: '#555', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, padding: '8px 12px', lineHeight: 1.6 }}>
          {t('documents.workerStatement.shareNote', 'You earn 30% of the repair fee for each job you complete. Parts profit goes to the shop.')}
        </div>
      </div>

      {/* Job list */}
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#555', marginBottom: 6, letterSpacing: '0.05em' }}>
        {t('documents.workerStatement.jobList', 'JOB LIST')} ({totalJobs})
      </div>
      <div style={{ fontSize: 11, color: '#777', marginBottom: 10 }}>
        {t('documents.workerStatement.jobListDesc', 'Each job you worked on during this period')}
      </div>

      {jobs.map((job: any) => (
        <div key={job.id} className="no-break" style={{ border: '1px solid #ccc', borderRadius: 4, marginBottom: 10, padding: 10, background: '#fff' }}>
          {/* Job header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: '#000' }}>
            <div>
              <strong>#{job.id}</strong>
              {' — '}
              <span>{(job as any).customerName || '-'}</span>
            </div>
            <div style={{ color: '#555' }}>{formatDate(job.completedAt)}</div>
          </div>

          {job.description && (
            <div style={{ fontSize: 11, color: '#555', marginBottom: 4 }}>{job.description}</div>
          )}

          {(job as any).parts?.length > 0 && (
            <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>
              {t('documents.profitReport.parts', 'Parts used')}:{' '}
              {(job as any).parts.map((p: any) => `${p.partName} x${p.quantity}`).join(', ')}
            </div>
          )}

          {/* Per-job earnings summary */}
          <div style={{
            borderTop: '1px solid #eee',
            paddingTop: 6,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 4,
          }}>
            <span style={{ fontSize: 11, color: '#555' }}>
              {t('documents.workerStatement.customerPaidRepair', 'Customer paid for repair')}:{' '}
              <strong style={{ color: '#000' }}>{formatDZD(job.repairFee)}</strong>
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
              {t('documents.workerStatement.yourShareJob', 'Your share')}:{' '}
              {formatDZD(job.workerProfit)}
            </span>
          </div>
        </div>
      ))}

      {/* Footer total */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <div style={{
          padding: '12px 24px',
          background: '#1f2937',
          color: '#fff',
          borderRadius: 4,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', marginBottom: 4 }}>
            {t('documents.workerStatement.totalEarnings', 'TOTAL EARNINGS')}
          </div>
          <div style={{ fontSize: 20, fontWeight: 800 }}>
            {formatDZD(totalEarnings)}
          </div>
        </div>
      </div>
    </DocumentLayout>
  )
}
