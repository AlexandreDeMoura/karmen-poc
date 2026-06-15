import { ReviewStatusBadge } from '../shared/ReviewStatusBadge'
import type {
  ApplicationListItem,
  FinancingType,
  ProblemSummary,
  RiskBucket,
} from '../application.types'

const amountFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const financingTypeLabels: Record<FinancingType, string> = {
  loan: 'Loan',
  factoring: 'Factoring',
}

const riskPresentation: Record<
  RiskBucket,
  { label: string; className: string }
> = {
  low: {
    label: 'Low',
    className: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-50 text-amber-900 ring-amber-600/20',
  },
  high: {
    label: 'High',
    className: 'bg-rose-50 text-rose-800 ring-rose-600/20',
  },
}

const problemPresentation: Array<{
  key: keyof ProblemSummary
  label: string
  shortLabel: string
  className: string
}> = [
  {
    key: 'blocking',
    label: 'blocking',
    shortLabel: 'Blocking',
    className: 'bg-rose-50 text-rose-800',
  },
  {
    key: 'warning',
    label: 'warnings',
    shortLabel: 'Warning',
    className: 'bg-amber-50 text-amber-900',
  },
  {
    key: 'info',
    label: 'information',
    shortLabel: 'Info',
    className: 'bg-sky-50 text-sky-800',
  },
]

function getApplicationPath(applicationId: string) {
  return `/applications/${encodeURIComponent(applicationId)}`
}

interface ApplicationListTableProps {
  applications: ApplicationListItem[]
}

interface RiskBadgeProps {
  riskBucket: RiskBucket
}

function RiskBadge({ riskBucket }: RiskBadgeProps) {
  const presentation = riskPresentation[riskBucket]

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${presentation.className}`}
    >
      {presentation.label}
    </span>
  )
}

interface ProblemCountsProps {
  summary: ProblemSummary
}

function ProblemCounts({ summary }: ProblemCountsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {problemPresentation.map((problem) => (
        <span
          key={problem.key}
          aria-label={`${summary[problem.key]} ${problem.label}`}
          className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${problem.className}`}
          title={problem.label}
        >
          <span aria-hidden="true">{problem.shortLabel}</span>
          {summary[problem.key]}
        </span>
      ))}
    </div>
  )
}

function ApplicationCards({ applications }: ApplicationListTableProps) {
  return (
    <div className="grid gap-4 md:hidden">
      {applications.map((application) => (
        <article
          key={application.applicationId}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-950">
                {application.companyName}
              </h2>
              <p className="mt-1 text-xs font-medium tracking-wide text-slate-500 uppercase">
                {application.applicationId}
              </p>
            </div>
            <ReviewStatusBadge status={application.documentReviewStatus} />
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-slate-100 pt-5 text-sm">
            <div>
              <dt className="text-slate-500">Financing</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {financingTypeLabels[application.financingType]}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Amount</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {amountFormatter.format(application.requestedAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Risk</dt>
              <dd className="mt-1.5">
                <RiskBadge riskBucket={application.riskBucket} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Global score</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {application.globalScore}
                <span className="font-normal text-slate-400"> / 100</span>
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="mb-2 text-slate-500">Problems</dt>
              <dd>
                <ProblemCounts summary={application.problemSummary} />
              </dd>
            </div>
          </dl>

          <a
            className="mt-5 inline-flex text-sm font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
            href={getApplicationPath(application.applicationId)}
          >
            Review application
          </a>
        </article>
      ))}
    </div>
  )
}

export function ApplicationListTable({
  applications,
}: ApplicationListTableProps) {
  return (
    <>
      <ApplicationCards applications={applications} />

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-245 border-collapse text-left">
            <caption className="sr-only">
              Financing applications and their document review status
            </caption>
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-4" scope="col">
                  Company
                </th>
                <th className="px-4 py-4" scope="col">
                  Financing
                </th>
                <th className="px-4 py-4" scope="col">
                  Amount
                </th>
                <th className="px-4 py-4" scope="col">
                  Risk
                </th>
                <th className="px-4 py-4" scope="col">
                  Score
                </th>
                <th className="px-4 py-4" scope="col">
                  Review status
                </th>
                <th className="px-5 py-4" scope="col">
                  Problems
                </th>
                <th className="px-5 py-4 text-right" scope="col">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((application) => (
                <tr
                  key={application.applicationId}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <th className="px-5 py-5" scope="row">
                    <span className="block font-semibold text-slate-950">
                      {application.companyName}
                    </span>
                    <span className="mt-1 block text-xs font-normal text-slate-500">
                      {application.applicationId}
                    </span>
                  </th>
                  <td className="px-4 py-5 text-sm text-slate-700">
                    {financingTypeLabels[application.financingType]}
                  </td>
                  <td className="px-4 py-5 text-sm font-semibold whitespace-nowrap text-slate-950">
                    {amountFormatter.format(application.requestedAmount)}
                  </td>
                  <td className="px-4 py-5">
                    <RiskBadge riskBucket={application.riskBucket} />
                  </td>
                  <td className="px-4 py-5 text-sm font-semibold text-slate-950">
                    {application.globalScore}
                    <span className="font-normal text-slate-400"> / 100</span>
                  </td>
                  <td className="px-4 py-5">
                    <ReviewStatusBadge
                      status={application.documentReviewStatus}
                    />
                  </td>
                  <td className="px-5 py-5">
                    <ProblemCounts summary={application.problemSummary} />
                  </td>
                  <td className="px-5 py-5 text-right">
                    <a
                      className="text-sm font-semibold whitespace-nowrap text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
                      href={getApplicationPath(application.applicationId)}
                    >
                      Review
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
