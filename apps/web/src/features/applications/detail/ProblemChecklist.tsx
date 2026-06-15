import type { DocumentProblem } from '../application.types'
import {
  countSelectedProblems,
  groupProblems,
  isClientFacingBlockingProblem,
} from './detail.logic'
import {
  problemSourceLabels,
  severityPresentation,
} from './detail.presentation'

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
  const isSelectable = isClientFacingBlockingProblem(problem)
  const content = (
    <div className="flex items-start gap-4">
      {isSelectable && (
        <input
          checked={checked}
          className="mt-1 size-4 shrink-0 accent-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          id={inputId}
          onChange={(event) =>
            onSelectionChange(problem.id, event.target.checked)
          }
          type="checkbox"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${severity.className}`}
          >
            {severity.label}
          </span>
          <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
            {problemSourceLabels[problem.source]}
          </span>
          {!isSelectable && (
            <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">
              Contexte uniquement
            </span>
          )}
        </div>

        <h4 className="mt-3 text-sm font-semibold text-slate-950 sm:text-base">
          {problem.analystLabel}
        </h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {problem.description}
        </p>

        {isSelectable && problem.clientFacingLabel && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <p className="text-xs font-semibold tracking-wide text-emerald-800 uppercase">
              Demande au client
            </p>
            <p className="mt-1 text-sm text-emerald-950">
              {problem.clientFacingLabel}
            </p>
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Action recommandée
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {problem.recommendedAction}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <li>
      {isSelectable ? (
        <label
          className={`block rounded-xl border p-4 transition sm:p-5 ${
            checked
              ? 'border-slate-400 bg-slate-50 shadow-sm'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
          htmlFor={inputId}
        >
          {content}
        </label>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
          {content}
        </div>
      )}
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
  const selectedCount = countSelectedProblems(
    problems,
    selectedProblemIds,
  )

  return (
    <fieldset>
      <legend className="text-base font-semibold text-slate-950">
        {title}
      </legend>
      <div className="mt-1 flex flex-col gap-3 @2xl:flex-row @2xl:items-end @2xl:justify-between">
        <div>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
        <p className="shrink-0 text-xs font-semibold text-slate-500">
          {problems.some(isClientFacingBlockingProblem)
            ? `${selectedCount} sur ${problems.length} ${
                selectedCount === 1 ? 'sélectionné' : 'sélectionnés'
              }`
            : `${problems.length} ${
                problems.length === 1 ? 'problème interne' : 'problèmes internes'
              }`}
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
  const { clientFacingProblems, analystOnlyProblems } = groupProblems(
    problems,
  )
  const selectedClientFacingCount = countSelectedProblems(
    clientFacingProblems,
    selectedProblemIds,
  )
  const hasSelectedClientFacingProblem = selectedClientFacingCount > 0

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 @2xl:flex-row @2xl:items-end @2xl:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-emerald-700 uppercase">
            Validation analyste
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
            Liste des problèmes détectés
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Sélectionnez les problèmes bloquants à communiquer au client. Les
            autres problèmes restent affichés à titre de contexte.
          </p>
        </div>
        <p className="text-sm font-medium text-slate-500">
          {problems.length}{' '}
          {problems.length === 1 ? 'problème détecté' : 'problèmes détectés'}
        </p>
      </div>

      {problems.length === 0 ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-6">
          <p className="text-sm font-semibold text-emerald-950">
            Aucun problème documentaire détecté
          </p>
          <p className="mt-1 text-sm leading-6 text-emerald-800">
            Ce contrôle ne nécessite ni relance client ni validation interne.
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-8">
          {clientFacingProblems.length > 0 && (
            <ProblemGroup
              description="Les demandes sélectionnées peuvent être incluses dans l’e-mail de relance au client."
              onSelectionChange={onSelectionChange}
              problems={clientFacingProblems}
              selectedProblemIds={selectedProblemIds}
              title="Demandes destinées au client"
            />
          )}

          {analystOnlyProblems.length > 0 && (
            <ProblemGroup
              description="Ces problèmes restent visibles pour l’analyse, sans être sélectionnables pour la génération de l’e-mail."
              onSelectionChange={onSelectionChange}
              problems={analystOnlyProblems}
              selectedProblemIds={selectedProblemIds}
              title="Autres problèmes détectés"
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
            ? `${selectedClientFacingCount} ${
                selectedClientFacingCount === 1
                  ? 'demande client est prête'
                  : 'demandes client sont prêtes'
              } pour la génération de l’e-mail`
            : 'La génération de l’e-mail n’est pas disponible'}
        </p>
        <p
          className={`mt-1 text-sm leading-6 ${
            hasSelectedClientFacingProblem
              ? 'text-emerald-800'
              : 'text-amber-800'
          }`}
        >
          {hasSelectedClientFacingProblem
            ? 'Seules les demandes client sélectionnées seront transmises à l’assistant de rédaction.'
            : clientFacingProblems.length === 0
              ? 'Aucun problème à communiquer au client n’a été détecté pour cette demande.'
              : 'Sélectionnez au moins une demande client avant de générer un e-mail.'}
        </p>
      </div>
    </section>
  )
}
