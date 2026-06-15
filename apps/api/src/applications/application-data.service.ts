import {
  Inject,
  Injectable,
  Optional,
  type OnModuleInit,
} from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Application } from './application.types';

export const APPLICATION_DATA_DIRECTORY = Symbol('APPLICATION_DATA_DIRECTORY');

export const APPLICATION_FIXTURE_FILENAMES = [
  'brasserie-du-marais.json',
  'studio-pixel.json',
  'transport-leclerc-express.json',
  'fleurs-de-saison.json',
] as const;

const DEFAULT_DATA_DIRECTORY = resolve(__dirname, '../../../../data');

@Injectable()
export class ApplicationDataService implements OnModuleInit {
  private applications: readonly Application[] | undefined;

  constructor(
    @Optional()
    @Inject(APPLICATION_DATA_DIRECTORY)
    private readonly dataDirectory: string = DEFAULT_DATA_DIRECTORY,
  ) {}

  onModuleInit(): void {
    this.getApplications();
  }

  getApplications(): readonly Application[] {
    if (!this.applications) {
      this.applications = this.loadApplications();
    }

    return this.applications;
  }

  private loadApplications(): readonly Application[] {
    const fixtureByFinancingRequestId = new Map<string, string>();

    return APPLICATION_FIXTURE_FILENAMES.map((filename) => {
      const application = this.loadFixture(filename);
      const financingRequestId = application.financing_request.id;
      const existingFilename =
        fixtureByFinancingRequestId.get(financingRequestId);

      if (existingFilename) {
        throw new Error(
          `Duplicate financing request ID "${financingRequestId}" in application fixture "${filename}"; already used by "${existingFilename}"`,
        );
      }

      fixtureByFinancingRequestId.set(financingRequestId, filename);
      return application;
    });
  }

  private loadFixture(filename: string): Application {
    const fixturePath = resolve(this.dataDirectory, filename);
    let source: string;

    try {
      source = readFileSync(fixturePath, 'utf8');
    } catch (error: unknown) {
      const reason =
        isNodeError(error) && error.code === 'ENOENT'
          ? 'file not found'
          : getErrorMessage(error);

      throw new Error(
        `Unable to read application fixture "${filename}": ${reason}`,
        { cause: error },
      );
    }

    let value: unknown;

    try {
      value = JSON.parse(source) as unknown;
    } catch (error: unknown) {
      throw new Error(
        `Invalid JSON in application fixture "${filename}": ${getErrorMessage(error)}`,
        { cause: error },
      );
    }

    assertApplication(value, filename);
    return value;
  }
}

function assertApplication(
  value: unknown,
  filename: string,
): asserts value is Application {
  assertRecord(value, filename, 'application');
  assertRecord(value.company, filename, 'company');
  assertNonEmptyString(value.company.id, filename, 'company.id');
  assertNonEmptyString(value.company.name, filename, 'company.name');

  assertRecord(value.financing_request, filename, 'financing_request');
  assertNonEmptyString(
    value.financing_request.id,
    filename,
    'financing_request.id',
  );
  assertFinancingType(
    value.financing_request.type,
    filename,
    'financing_request.type',
  );
  assertNumber(
    value.financing_request.amount,
    filename,
    'financing_request.amount',
  );

  if (!Array.isArray(value.documents)) {
    throw invalidFixtureError(filename, 'documents must be an array');
  }

  value.documents.forEach((document, index) => {
    const path = `documents[${index}]`;
    assertRecord(document, filename, path);
    assertNonEmptyString(document.id, filename, `${path}.id`);
    assertDocumentType(document.type, filename, `${path}.type`);
    assertRecord(document.metadata, filename, `${path}.metadata`);
    assertOptionalNumber(
      document.metadata.year,
      filename,
      `${path}.metadata.year`,
    );
    assertOptionalString(
      document.metadata.bank,
      filename,
      `${path}.metadata.bank`,
    );
    assertOptionalString(
      document.metadata.account,
      filename,
      `${path}.metadata.account`,
    );
    assertOptionalNumber(
      document.metadata.months_covered,
      filename,
      `${path}.metadata.months_covered`,
    );
  });

  assertRecord(value.score, filename, 'score');
  assertNonEmptyString(value.score.id, filename, 'score.id');
  assertRiskBucket(value.score.risk_bucket, filename, 'score.risk_bucket');
  assertNumber(value.score.global_score, filename, 'score.global_score');
}

function assertRecord(
  value: unknown,
  filename: string,
  path: string,
): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw invalidFixtureError(filename, `${path} must be an object`);
  }
}

function assertNonEmptyString(
  value: unknown,
  filename: string,
  path: string,
): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw invalidFixtureError(filename, `${path} must be a non-empty string`);
  }
}

function assertOptionalString(
  value: unknown,
  filename: string,
  path: string,
): asserts value is string | undefined {
  if (value !== undefined && typeof value !== 'string') {
    throw invalidFixtureError(filename, `${path} must be a string`);
  }
}

function assertNumber(
  value: unknown,
  filename: string,
  path: string,
): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw invalidFixtureError(filename, `${path} must be a finite number`);
  }
}

function assertOptionalNumber(
  value: unknown,
  filename: string,
  path: string,
): asserts value is number | undefined {
  if (
    value !== undefined &&
    (typeof value !== 'number' || !Number.isFinite(value))
  ) {
    throw invalidFixtureError(filename, `${path} must be a finite number`);
  }
}

function assertFinancingType(
  value: unknown,
  filename: string,
  path: string,
): asserts value is Application['financing_request']['type'] {
  if (value !== 'loan' && value !== 'factoring') {
    throw invalidFixtureError(filename, `${path} is invalid`);
  }
}

function assertDocumentType(
  value: unknown,
  filename: string,
  path: string,
): asserts value is Application['documents'][number]['type'] {
  if (value !== 'liasse_fiscale' && value !== 'releve_bancaire') {
    throw invalidFixtureError(filename, `${path} is invalid`);
  }
}

function assertRiskBucket(
  value: unknown,
  filename: string,
  path: string,
): asserts value is Application['score']['risk_bucket'] {
  if (value !== 'low' && value !== 'medium' && value !== 'high') {
    throw invalidFixtureError(filename, `${path} is invalid`);
  }
}

function invalidFixtureError(filename: string, reason: string): Error {
  return new Error(`Invalid application fixture "${filename}": ${reason}`);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === 'object' && error !== null && 'code' in error;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
