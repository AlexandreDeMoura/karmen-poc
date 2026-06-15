import { Test } from '@nestjs/testing';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  APPLICATION_DATA_DIRECTORY,
  APPLICATION_FIXTURE_FILENAMES,
  ApplicationDataService,
} from './application-data.service';
import type { Application } from './application.types';

describe('ApplicationDataService', () => {
  let fixtureDirectory: string;

  beforeEach(() => {
    fixtureDirectory = mkdtempSync(join(tmpdir(), 'karmen-applications-'));
  });

  afterEach(() => {
    rmSync(fixtureDirectory, { recursive: true, force: true });
  });

  it('loads the four expected fixtures in deterministic filename order', () => {
    writeExpectedFixtures(fixtureDirectory);
    writeFileSync(join(fixtureDirectory, 'unexpected.json'), 'not valid JSON');

    const applications = new ApplicationDataService(
      fixtureDirectory,
    ).getApplications();

    expect(applications).toHaveLength(4);
    expect(
      applications.map((application) => application.financing_request.id),
    ).toEqual(['fr-1', 'fr-2', 'fr-3', 'fr-4']);
  });

  it('loads fixtures during Nest module initialization', async () => {
    writeExpectedFixtures(fixtureDirectory);
    const moduleRef = await Test.createTestingModule({
      providers: [
        ApplicationDataService,
        {
          provide: APPLICATION_DATA_DIRECTORY,
          useValue: fixtureDirectory,
        },
      ],
    }).compile();

    await moduleRef.init();

    expect(
      moduleRef.get(ApplicationDataService).getApplications(),
    ).toHaveLength(4);

    await moduleRef.close();
  });

  it('returns the cached applications without parsing the files again', () => {
    writeExpectedFixtures(fixtureDirectory);
    const service = new ApplicationDataService(fixtureDirectory);

    const firstLoad = service.getApplications();
    writeFileSync(
      join(fixtureDirectory, APPLICATION_FIXTURE_FILENAMES[0]),
      'not valid JSON',
    );

    expect(service.getApplications()).toBe(firstLoad);
  });

  it('indexes applications by financing request ID', () => {
    writeExpectedFixtures(fixtureDirectory);
    const service = new ApplicationDataService(fixtureDirectory);
    const applications = service.getApplications();

    applications.forEach((application) => {
      expect(
        service.getApplicationByFinancingRequestId(
          application.financing_request.id,
        ),
      ).toBe(application);
    });
    expect(
      service.getApplicationByFinancingRequestId('unknown-application'),
    ).toBeUndefined();
  });

  it('reuses the cached index without parsing the files again', () => {
    writeExpectedFixtures(fixtureDirectory);
    const service = new ApplicationDataService(fixtureDirectory);
    const application = service.getApplicationByFinancingRequestId('fr-1');

    writeFileSync(
      join(fixtureDirectory, APPLICATION_FIXTURE_FILENAMES[0]),
      'not valid JSON',
    );

    expect(service.getApplicationByFinancingRequestId('fr-1')).toBe(
      application,
    );
  });

  it('fails with the missing fixture filename', () => {
    writeExpectedFixtures(fixtureDirectory);
    rmSync(join(fixtureDirectory, APPLICATION_FIXTURE_FILENAMES[1]));

    expect(() =>
      new ApplicationDataService(fixtureDirectory).getApplications(),
    ).toThrow(
      'Unable to read application fixture "studio-pixel.json": file not found',
    );
  });

  it('fails with the malformed fixture filename', () => {
    writeExpectedFixtures(fixtureDirectory);
    writeFileSync(
      join(fixtureDirectory, APPLICATION_FIXTURE_FILENAMES[2]),
      '{"company":',
    );

    expect(() =>
      new ApplicationDataService(fixtureDirectory).getApplications(),
    ).toThrow(
      'Invalid JSON in application fixture "transport-leclerc-express.json"',
    );
  });

  it('fails when a required section or identifier is invalid', () => {
    writeExpectedFixtures(fixtureDirectory);
    const invalidFixture = createApplication('fr-2');
    invalidFixture.company.id = '';
    writeFixture(
      fixtureDirectory,
      APPLICATION_FIXTURE_FILENAMES[1],
      invalidFixture,
    );

    expect(() =>
      new ApplicationDataService(fixtureDirectory).getApplications(),
    ).toThrow(
      'Invalid application fixture "studio-pixel.json": company.id must be a non-empty string',
    );
  });

  it('fails with the offending filename when financing request IDs repeat', () => {
    writeExpectedFixtures(fixtureDirectory);
    writeFixture(
      fixtureDirectory,
      APPLICATION_FIXTURE_FILENAMES[3],
      createApplication('fr-2'),
    );

    expect(() =>
      new ApplicationDataService(fixtureDirectory).getApplications(),
    ).toThrow(
      'Duplicate financing request ID "fr-2" in application fixture "fleurs-de-saison.json"; already used by "studio-pixel.json"',
    );
  });
});

function writeExpectedFixtures(directory: string): void {
  APPLICATION_FIXTURE_FILENAMES.forEach((filename, index) => {
    writeFixture(directory, filename, createApplication(`fr-${index + 1}`));
  });
}

function writeFixture(
  directory: string,
  filename: string,
  application: Application,
): void {
  writeFileSync(join(directory, filename), JSON.stringify(application));
}

function createApplication(financingRequestId: string): Application {
  return {
    company: {
      id: `company-${financingRequestId}`,
      name: `Company ${financingRequestId}`,
      siren: '123456789',
      businessType: 'Test',
      legalCategory: 'SAS',
      codeNaf: '0000Z',
      creationDate: '2020-01-01',
      address: '1 Test Street',
      countryCode: 'FR',
      postalCode: '75000',
      owner: 'Test Owner',
    },
    financing_request: {
      id: financingRequestId,
      type: 'loan',
      status: 'pending_review',
      company_id: `company-${financingRequestId}`,
      fundUsage: 'Testing',
      rejectedReason: null,
      amount: 10_000,
      durationInMonth: 12,
      interestRate: 5,
    },
    documents: [
      {
        id: `document-${financingRequestId}`,
        name: 'Bank statements',
        type: 'releve_bancaire',
        company_id: `company-${financingRequestId}`,
        financing_request_id: financingRequestId,
        metadata: {
          account: `account-${financingRequestId}`,
          months_covered: 12,
        },
      },
    ],
    score: {
      id: `score-${financingRequestId}`,
      financing_request_id: financingRequestId,
      risk_bucket: 'low',
      global_score: 80,
    },
  };
}
