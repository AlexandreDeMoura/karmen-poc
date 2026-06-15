import type {
  DocumentProblem,
  ProblemSeverity,
  ProblemSource,
} from './application.types'

const severityPresentation: Record<
  ProblemSeverity,
  { label: string; className: string }
> = {
  blocking: {
    label: 'Blocking',
    className: 'border-rose-200 bg-rose-50 text-rose-800',
  },
  warning: {
    label: 'Warning',
    className: 'border-amber-200 bg-amber-50 text-amber-900',
  },
  info: {
    label: 'Information',
    className: 'border-sky-200 bg-sky-50 text-sky-800',
  },
}

const sourceLabels: Record<ProblemSource, string> = {
  requirements_engine: 'Requirements engine',
  mocked_document_diagnostic: 'Mocked document diagnostic',
  score_context: 'Score context',
}

interface ProblemChecklistProps {
  problems: DocumentProblem[]
  selectedProblemIds: ReadonlySet<string>
  onSelectionChange: (problemId: string, selected: boolean) => void
}

interface ProblemGroupProps {
  title: string
  description: string
  problems: DocumentProblem[]
  selectedProblemIds: ReadonlySet<string>
  onSelectionChange: (problemId: string, selected: boolean) => void
}

interface ProblemCardProps {
  problem: DocumentProblem
  checked: boolean
  onSelectionChange: (problemId: string, selected: boolean) => void
}

function ProblemCard({
  problem,
  checked,
  onSelectionChange,
}: ProblemCardProps) {
  const severity = severityPresentation[problem.severity]
  const inputId = `problem-${problem.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`

  return (
    <li>
      <label
        className={`block rounded-xl border p-4 transition sm:p-5 ${
          checked
            ? 'border-slate-400 bg-slate-50 shadow-sm'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
        htmlFor={inputId}
      >
        <div className="flex items-start gap-4">
          <input
            checked={checked}
            className="mt-1 size-4 shrink-0 accent-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
            id={inputId}
            onChange={(event) =>
              onSelectionChange(problem.id, event.target.checked)
            }
            type="checkbox"
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severity.className}`}
              >
                {severity.label}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                {sourceLabels[problem.source]}
              </span>
              {!problem.clientFacing && (
                <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">
                  Excluded from client communication
                </span>
              )}
            </div>

            <h4 className="mt-3 text-sm font-semibold text-slate-950 sm:text-base">
              {problem.analystLabel}
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {problem.description}
            </p>

            {problem.clientFacing && problem.clientFacingLabel && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                  Client request
                </p>
                <p className="mt-1 text-sm text-emerald-950">
                  {problem.clientFacingLabel}
                </p>
              </div>
            )}

            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Recommended action
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {problem.recommendedAction}
              </p>
            </div>
          </div>
        </div>
      </label>
    </li>
  )
}

function ProblemGroup({
  title,
  description,
  problems,
  selectedProblemIds,
  onSelectionChange,
}: ProblemGroupProps) {
  const selectedCount = problems.filter((problem) =>
    selectedProblemIds.has(problem.id),
  ).length

  return (
    <fieldset>
      <legend className="text-base font-semibold text-slate-950">
        {title}
      </legend>
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
        <p className="shrink-0 text-xs font-semibold text-slate-500">
          {selectedCount} of {problems.length} selected
        </p>
      </div>

      <ul className="mt-4 grid gap-3">
        {problems.map((problem) => (
          <ProblemCard
            key={problem.id}
            checked={selectedProblemIds.has(problem.id)}
            onSelectionChange={onSelectionChange}
            problem={problem}
          />
        ))}
      </ul>
    </fieldset>
  )
}

export function ProblemChecklist({
  problems,
  selectedProblemIds,
  onSelectionChange,
}: ProblemChecklistProps) {
  const clientFacingProblems = problems.filter(
    (problem) => problem.clientFacing,
  )
  const analystOnlyProblems = problems.filter(
    (problem) => !problem.clientFacing,
  )
  const selectedClientFacingCount = clientFacingProblems.filter((problem) =>
    selectedProblemIds.has(problem.id),
  ).length
  const hasSelectedClientFacingProblem = selectedClientFacingCount > 0

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
            Analyst validation
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Detected problem checklist
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Confirm which detected issues should remain selected before
            preparing client communication.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {problems.length} {problems.length === 1 ? 'problem' : 'problems'}{' '}
          detected
        </p>
      </div>

      {problems.length === 0 ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6">
          <p className="text-sm font-semibold text-emerald-950">
            No document problems detected
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            The current review does not require client follow-up or
            analyst-only validation.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-8">
          {clientFacingProblems.length > 0 && (
            <ProblemGroup
              description="Selected requests can be included in the client follow-up email."
              onSelectionChange={onSelectionChange}
              problems={clientFacingProblems}
              selectedProblemIds={selectedProblemIds}
              title="Client-facing requests"
            />
          )}

          {analystOnlyProblems.length > 0 && (
            <ProblemGroup
              description="These issues remain internal and are never included in client communication."
              onSelectionChange={onSelectionChange}
              problems={analystOnlyProblems}
              selectedProblemIds={selectedProblemIds}
              title="Analyst-only context"
            />
          )}
        </div>
      )}

      <div
        aria-live="polite"
        className={`mt-7 rounded-xl border px-4 py-4 ${
          hasSelectedClientFacingProblem
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            hasSelectedClientFacingProblem
              ? 'text-emerald-950'
              : 'text-amber-950'
          }`}
        >
          {hasSelectedClientFacingProblem
            ? `${selectedClientFacingCount} client ${
                selectedClientFacingCount === 1 ? 'request is' : 'requests are'
              } ready for email generation`
            : 'Email generation is not available'}
        </p>
        <p
          className={`mt-1 text-sm leading-6 ${
            hasSelectedClientFacingProblem
              ? 'text-emerald-800'
              : 'text-amber-800'
          }`}
        >
          {hasSelectedClientFacingProblem
            ? 'Only selected client-facing requests will be sent to the email assistant.'
            : clientFacingProblems.length === 0
              ? 'No client-facing problems were detected for this application.'
              : 'Select at least one client-facing request before generating an email.'}
        </p>
      </div>
    </section>
  )
}
