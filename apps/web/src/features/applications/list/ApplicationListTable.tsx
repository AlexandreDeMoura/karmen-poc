import { ReviewStatusBadge } from '../shared/ReviewStatusBadge'
import type { ApplicationListItem, RiskBucket } from '../application.types'
import {
  financingTypeLabels,
  formatAmount,
} from '../application.presentation'
import { getApplicationPath } from '../applications.routes'
import { riskPresentation } from './list.presentation'

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
              <dt className="text-slate-500">Financement</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {financingTypeLabels[application.financingType]}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Montant</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {formatAmount(application.requestedAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Risque</dt>
              <dd className="mt-1.5">
                <RiskBadge riskBucket={application.riskBucket} />
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Score global</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {application.globalScore}
                <span className="font-normal text-slate-400"> / 100</span>
              </dd>
            </div>
          </dl>

          <a
            className="mt-5 inline-flex text-sm font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
            href={getApplicationPath(application.applicationId)}
          >
            Examiner la demande
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
              Demandes de financement et état de leur contrôle documentaire
            </caption>
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-4" scope="col">
                  Entreprise
                </th>
                <th className="px-4 py-4" scope="col">
                  Financement
                </th>
                <th className="px-4 py-4" scope="col">
                  Montant
                </th>
                <th className="px-4 py-4" scope="col">
                  Risque
                </th>
                <th className="px-4 py-4" scope="col">
                  Score
                </th>
                <th className="px-4 py-4" scope="col">
                  État du contrôle
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
                    {formatAmount(application.requestedAmount)}
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
                  <td className="px-5 py-5 text-right">
                    <a
                      className="text-sm font-semibold whitespace-nowrap text-slate-950 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950"
                      href={getApplicationPath(application.applicationId)}
                    >
                      Examiner
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
