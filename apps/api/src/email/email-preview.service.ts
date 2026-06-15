import { BadRequestException, Injectable } from '@nestjs/common';
import type { DocumentProblem } from '../document-review/document-review.types';
import { getProblemCatalogEntry } from '../document-review/problem-catalog';
import type { EmailPreview } from './email-preview.types';

const EMAIL_SUBJECT =
  'Documents complémentaires nécessaires pour finaliser votre demande';

@Injectable()
export class EmailPreviewService {
  generatePreview(
    problems: readonly DocumentProblem[],
    selectedProblemIds: unknown,
  ): EmailPreview {
    const selectedIds = validateSelectedProblemIds(selectedProblemIds);
    const problemById = new Map(
      problems.map((problem) => [problem.id, problem]),
    );

    for (const selectedId of selectedIds) {
      if (!problemById.has(selectedId)) {
        throw new BadRequestException(
          `Le problème sélectionné « ${selectedId} » est absent du contrôle de la demande`,
        );
      }
    }

    const selectedIdSet = new Set(selectedIds);
    const includedProblems = problems.filter((problem) => {
      if (!selectedIdSet.has(problem.id) || !problem.clientFacing) {
        return false;
      }

      return (
        getProblemCatalogEntry(problem.code).buildEmailFragment !== undefined
      );
    });

    if (includedProblems.length === 0) {
      throw new BadRequestException(
        'Au moins un problème sélectionné doit pouvoir être communiqué au client par e-mail',
      );
    }

    const fragments = includedProblems.map((problem) => {
      const buildEmailFragment = getProblemCatalogEntry(
        problem.code,
      ).buildEmailFragment;

      if (!buildEmailFragment) {
        throw new Error(
          `Le problème « ${problem.id} » a été inclus sans contenu pour l’e-mail`,
        );
      }

      return buildEmailFragment(problem.metadata ?? {});
    });

    return {
      subject: EMAIL_SUBJECT,
      body: buildEmailBody(fragments),
      includedProblemIds: includedProblems.map((problem) => problem.id),
    };
  }
}

function validateSelectedProblemIds(value: unknown): string[] {
  if (!isStringArray(value)) {
    throw new BadRequestException(
      'selectedProblemIds doit être un tableau de chaînes de caractères',
    );
  }

  const seenIds = new Set<string>();

  for (const selectedId of value) {
    if (seenIds.has(selectedId)) {
      throw new BadRequestException(
        `Le problème sélectionné « ${selectedId} » est présent plusieurs fois`,
      );
    }

    seenIds.add(selectedId);
  }

  return value;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

function buildEmailBody(fragments: readonly string[]): string {
  const bullets = fragments.map(
    (fragment, index) =>
      `- ${fragment}${index === fragments.length - 1 ? '.' : ' ;'}`,
  );

  return [
    'Bonjour,',
    '',
    'Merci pour les documents transmis.',
    '',
    'Pour finaliser l’analyse de votre demande, pouvez-vous nous transmettre :',
    '',
    ...bullets,
    '',
    'Merci d’avance,',
    '',
    'L’équipe Karmen',
  ].join('\n');
}
