import { 
  generateForm101Pdf, 
  generateForm121Pdf, 
  generateForm106ABPdf,
  generateForm106CPdf,
  generateForm106DPdf,
  generateForm106EFPdf,
  generateForm106GPdf,
  generateForm106HPdf,
  generateForm106IPdf,
  generateForm106JPdf,
  generateForm106J2Pdf,
  generateForm107Pdf,
  generateForm108Pdf,
  generateForm122A1Pdf,
  generateForm122A2Pdf,
  mapMasterCaseToForm101Fields, 
  mapMasterCaseToForm121Fields,
  mapForm106AB,
  mapForm106C,
  mapForm106D,
  mapForm106EF,
  mapForm106G,
  mapForm106H,
  mapForm106I,
  mapForm106J,
  mapForm106J2,
  mapMasterCaseToForm107,
  mapMasterCaseToForm108,
  calculateNetCashFlow,
  runHardAuditFlags,
  validateExemptionCapsAndSummaries
} from '../lib/index';
import {
  parseTaxReturn,
  parsePaystub,
  parseBankStatement,
  parseCreditReport,
  calculateReviewSummary,
  executeAttorneySignoff,
  applyFieldOverride,
  globalExtractionPipeline
} from '../lib/engine';

import type { 
  MasterCaseData, 
  RealPropertyItem, 
  PersonalPropertyItem, 
  ClaimedExemptionItem, 
  SecuredClaimItem, 
  UnsecuredClaimItem, 
  ExecutoryContractItem, 
  CodebtorItem,
  ScheduleJ2Data
} from '../lib/types/master-case';
import { createSampleMasterCaseData } from '../tests/helpers/sample-case';

let currentStep = 1;
let activeTab: 'form101' | 'form121' | 'form106ab' | 'form106c' | 'form106d' | 'form106ef' | 'form106g' | 'form106h' | 'form106i' | 'form106j' | 'form106j2' | 'form107' | 'form108' | 'form122a1' | 'form122a2' = 'form101';
let currentBlobUrls: Record<string, string | null> = {};

const state = {
  realProperty: [
    {
      id: 're_1',
      address: '100 Example Street, Example City, CO 00000',
      legalDescription: 'EXAMPLE LEGAL DESCRIPTION - NOT REAL',
      nature: 'SINGLE_FAMILY',
      ownership: 'FEE_SIMPLE',
      currentValue: 450000,
      totalLiens: 280000,
      netEquity: 170000
    }
  ],
  personalProperty: [
    {
      id: 'pp_1',
      category: 'VEHICLE',
      lineNumber: '3',
      description: '2022 Toyota RAV4 (45k miles, VIN: EXAMPLE-VIN-NOT-VALID)',
      currentValue: 22000
    },
    {
      id: 'pp_2',
      category: 'FINANCIAL_ACCOUNT',
      lineNumber: '17',
      description: 'Example Checking Account (*0000)',
      currentValue: 1250
    },
    {
      id: 'pp_3',
      category: 'RETIREMENT_ACCOUNT',
      lineNumber: '21',
      description: 'Example Retirement Account',
      currentValue: 45000
    }
  ],
  exemptions: [
    {
      id: 'ex_1',
      propertyRefId: 're_1',
      statuteCitation: 'C.R.S. § 38-41-201',
      description: 'Homestead Exemption in Principal Residence',
      claimedAmount: 170000
    },
    {
      id: 'ex_2',
      propertyRefId: 'pp_1',
      statuteCitation: 'C.R.S. § 13-54-102(1)(j)(I)',
      description: 'Motor Vehicle Exemption',
      claimedAmount: 15000
    },
    {
      id: 'ex_3',
      propertyRefId: 'pp_3',
      statuteCitation: 'C.R.S. § 13-54-102(1)(s)',
      description: 'Qualified Retirement Account (100% Exempt)',
      claimedAmount: 45000
    }
  ],
  securedClaims: [
    {
      id: 'sec_1',
      creditorName: 'Example Mortgage Creditor',
      mailingAddress: 'PO Box 0000, Example City, CO 00000',
      accountNumber: '*0000',
      collateralPropertyRefId: 're_1',
      collateralDescription: '100 Example Street, Example City, CO 00000',
      collateralValue: 450000,
      totalClaimAmount: 280000,
      securedAmount: 280000,
      unsecuredAmount: 0
    },
    {
      id: 'sec_2',
      creditorName: 'Example Vehicle Creditor',
      mailingAddress: '200 Example Avenue, Example City, CO 00000',
      accountNumber: '*0000',
      collateralPropertyRefId: 'pp_1',
      collateralDescription: '2022 Toyota RAV4 (45k miles, VIN: EXAMPLE-VIN-NOT-VALID)',
      collateralValue: 22000,
      totalClaimAmount: 14200,
      securedAmount: 14200,
      unsecuredAmount: 0
    }
  ],
  unsecuredClaims: [
    {
      id: 'unsec_1',
      claimType: 'NON_PRIORITY' as const,
      creditorName: 'Example Unsecured Creditor',
      mailingAddress: 'PO Box 0001, Example City, CO 00000',
      accountNumber: '*0000',
      dateIncurred: '2023-05-15',
      description: 'Credit Card Purchases',
      totalClaimAmount: 4500,
      priorityAmount: 0,
      isContingent: false,
      isUnliquidated: false,
      isDisputed: false,
      hasCodebtor: false
    }
  ],
  contracts: [
    {
      id: 'g_1',
      counterpartyName: 'Example Residential Lessor',
      counterpartyAddress: '300 Example Boulevard, Example City, CO 00000',
      description: 'Residential Apartment Lease - Apt 4B',
      expirationDate: '2027-04-30',
      intention: 'ASSUME'
    }
  ],
  codebtors: [
    {
      id: 'h_1',
      codebtorName: 'Example Joint Debtor',
      codebtorAddress: '100 Example Street, Example City, CO 00000',
      associatedClaimIds: ['sec_1']
    }
  ]
};

function createFieldWrapper<T>(val: T, fieldId: string, status: any = 'user_verified'): any {
  return {
    field_id: fieldId,
    value: val,
    source: { type: 'manual_entry', calculated_by: 'LexPetition Engine UI' },
    status: status,
    attorney_notes: '',
    mapped_destinations: []
  };
}

function buildMasterCaseDataFromUI(): MasterCaseData {
  const data: MasterCaseData = createSampleMasterCaseData();

  const fn1 = (document.getElementById('first-name') as HTMLInputElement)?.value || 'Jane';
  const mn1 = (document.getElementById('middle-name') as HTMLInputElement)?.value || 'Marie';
  const ln1 = (document.getElementById('last-name') as HTMLInputElement)?.value || 'Doe';
  const ssn1 = (document.getElementById('ssn-full') as HTMLInputElement)?.value || '000-00-0000';
  const phone1 = (document.getElementById('phone') as HTMLInputElement)?.value || '';
  const st1 = (document.getElementById('street') as HTMLInputElement)?.value || '100 Example Street';
  const city1 = (document.getElementById('city') as HTMLInputElement)?.value || 'Example City';
  const state1 = (document.getElementById('state') as HTMLInputElement)?.value || 'CO';
  const zip1 = (document.getElementById('zip') as HTMLInputElement)?.value || '00000';

  data.debtor_1 = {
    first_name: createFieldWrapper(fn1, 'd1.first_name'),
    middle_name: createFieldWrapper(mn1, 'd1.middle_name'),
    last_name: createFieldWrapper(ln1, 'd1.last_name'),
    ssn_full: createFieldWrapper(ssn1, 'd1.ssn_full'),
    phone_day: createFieldWrapper(phone1, 'd1.phone'),
    street_address: createFieldWrapper(st1, 'd1.street'),
    city: createFieldWrapper(city1, 'd1.city'),
    state: createFieldWrapper(state1, 'd1.state'),
    zip_code: createFieldWrapper(zip1, 'd1.zip')
  };

  const hasJoint = (document.getElementById('has-joint-debtor-toggle') as HTMLInputElement)?.checked ?? false;
  if (hasJoint) {
    const fn2 = (document.getElementById('d2-first-name') as HTMLInputElement)?.value || 'John';
    const mn2 = (document.getElementById('d2-middle-name') as HTMLInputElement)?.value || 'Robert';
    const ln2 = (document.getElementById('d2-last-name') as HTMLInputElement)?.value || 'Doe';
    const ssn2 = (document.getElementById('d2-ssn-full') as HTMLInputElement)?.value || '000-00-0000';
    const phone2 = (document.getElementById('d2-phone') as HTMLInputElement)?.value || '';
    const st2 = (document.getElementById('d2-street') as HTMLInputElement)?.value || '100 Example Street';
    const city2 = (document.getElementById('d2-city') as HTMLInputElement)?.value || 'Example City';
    const zip2 = (document.getElementById('d2-zip') as HTMLInputElement)?.value || '00000';

    data.debtor_2 = {
      first_name: createFieldWrapper(fn2, 'd2.first_name'),
      middle_name: createFieldWrapper(mn2, 'd2.middle_name'),
      last_name: createFieldWrapper(ln2, 'd2.last_name'),
      ssn_full: createFieldWrapper(ssn2, 'd2.ssn_full'),
      phone_day: createFieldWrapper(phone2, 'd2.phone'),
      street_address: createFieldWrapper(st2, 'd2.street'),
      city: createFieldWrapper(city2, 'd2.city'),
      state: createFieldWrapper('CO', 'd2.state'),
      zip_code: createFieldWrapper(zip2, 'd2.zip')
    };
  } else {
    data.debtor_2 = undefined;
  }

  const reItems: RealPropertyItem[] = state.realProperty.map(r => ({
    id: r.id,
    address: createFieldWrapper(r.address, 're.address'),
    nature_of_interest: createFieldWrapper(r.nature as any, 're.nature'),
    ownership_type: createFieldWrapper(r.ownership as any, 're.ownership'),
    current_value: createFieldWrapper(r.currentValue, 're.value'),
    total_liens: createFieldWrapper(r.totalLiens, 're.liens')
  }));

  const ppItems: PersonalPropertyItem[] = state.personalProperty.map(p => ({
    id: p.id,
    category: createFieldWrapper(p.category as any, 'pp.category'),
    line_number: createFieldWrapper(p.lineNumber, 'pp.line_number'),
    description: createFieldWrapper(p.description, 'pp.desc'),
    current_value: createFieldWrapper(p.currentValue, 'pp.value')
  }));

  const totalREVal = reItems.reduce((sum, r) => sum + r.current_value.value, 0);
  const totalPPVal = ppItems.reduce((sum, p) => sum + p.current_value.value, 0);

  data.schedule_ab = {
    real_property: reItems,
    personal_property: ppItems,
    total_real_property_value: createFieldWrapper(totalREVal, 'ab.total_re'),
    total_personal_property_value: createFieldWrapper(totalPPVal, 'ab.total_pp'),
    total_property_value: createFieldWrapper(totalREVal + totalPPVal, 'ab.total_combined')
  };

  return data;
}

function updateDOMSummaries() {
  const masterData = buildMasterCaseDataFromUI();

  const auditFlags = runHardAuditFlags(masterData);
  const valStatus = document.getElementById('val-status');
  const valText = document.getElementById('val-text');
  if (valStatus && valText) {
    if (auditFlags.length === 0) {
      valStatus.className = 'status-indicator success';
      valText.innerText = 'Deterministic Validation Engine: 0 Hard Audit Flags';
    } else {
      valStatus.className = 'status-indicator warning';
      valText.innerText = `Deterministic Validation Engine: ${auditFlags.length} Audit Flag(s) Triggered`;
    }
  }

  const reviewSummary = calculateReviewSummary(masterData);
  const readinessEl = document.getElementById('attorney-readiness-val');
  if (readinessEl) readinessEl.innerText = `${reviewSummary.readiness_percentage.toFixed(1)}%`;

  const criticalEl = document.getElementById('attorney-critical-flags-val');
  if (criticalEl) criticalEl.innerText = `${reviewSummary.hard_audit_critical_flags_count}`;
}

function updateStep(newStep: number) {
  currentStep = Math.max(1, Math.min(17, newStep));

  document.querySelectorAll('.form-step').forEach((el, index) => {
    el.classList.toggle('active', index + 1 === currentStep);
  });

  const indicator = document.getElementById('step-indicator');
  if (indicator) indicator.innerText = `Step ${currentStep} of 17`;

  const jumpSelect = document.getElementById('step-jump-select') as HTMLSelectElement;
  if (jumpSelect) jumpSelect.value = String(currentStep);

  updateDOMSummaries();
}

document.addEventListener('DOMContentLoaded', () => {
  // Auth Gate
  const authForm = document.getElementById('auth-form');
  const overlay = document.getElementById('landing-overlay');
  const demoAcknowledgment = document.getElementById('demo-acknowledgment') as HTMLInputElement;
  const authErr = document.getElementById('auth-error');

  if (sessionStorage.getItem('lexpetition_demo_acknowledged') === 'true') {
    if (overlay) overlay.style.display = 'none';
  }

    authForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (demoAcknowledgment?.checked) {
      sessionStorage.setItem('lexpetition_demo_acknowledged', 'true');
      if (overlay) overlay.style.display = 'none';
      if (authErr) authErr.style.display = 'none';
    } else {
      if (authErr) {
        authErr.style.display = 'block';
        authErr.innerText = 'Please confirm that you will use synthetic data only.';
      }
    }
  });

  // Buttons
  document.getElementById('prev-btn')?.addEventListener('click', () => updateStep(currentStep - 1));
  document.getElementById('next-btn')?.addEventListener('click', () => updateStep(currentStep + 1));
  document.getElementById('step-jump-select')?.addEventListener('change', (e) => {
    updateStep(parseInt((e.target as HTMLSelectElement).value, 10));
  });

  updateStep(1);
});
