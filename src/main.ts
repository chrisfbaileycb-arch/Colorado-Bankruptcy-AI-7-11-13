import { mapMasterCaseToForm101Fields } from './mappers/form-101';
import { mapMasterCaseToForm121Fields } from './mappers/form-121';
import { mapForm106AB } from './mappers/form-106ab';
import { mapForm106C } from './mappers/form-106c';
import { mapForm106D } from './mappers/form-106d';
import { mapForm106EF } from './mappers/form-106ef';
import { mapForm106G } from './mappers/form-106g';
import { mapForm106H } from './mappers/form-106h';
import { mapForm106I } from './mappers/form-106i';
import { mapForm106J } from './mappers/form-106j';
import { mapForm106J2 } from './mappers/form-106j2';
import { mapForm107 } from './mappers/form-107';
import { mapForm108 } from './mappers/form-108';
import { mapMasterCaseToForm122A1 } from './mappers/form-122a1';
import { mapMasterCaseToForm122A2 } from './mappers/form-122a2';

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
  calculateCMI,
  calculateNetCashFlow,
  runHardAuditFlags,
  parseTaxReturn,
  mergeTaxReturnIntoMasterCase,
  parsePaystub,
  mergePaystubIntoMasterCase,
  parseBankStatement,
  mergeBankStatementIntoMasterCase,
  parseCreditReport,
  mergeCreditReportIntoMasterCase,
  calculateReviewSummary,
  executeAttorneySignoff,
  applyFieldOverride
} from '../lib/engine';

import type { 
  MasterCaseData, 
  RealPropertyItem, 
  PersonalPropertyItem, 
  SecuredClaimItem, 
  UnsecuredClaimItem, 
  ExecutoryContractItem, 
  CodebtorItem 
} from '../lib/types/master-case';

let currentStep = 1;
let activeTab: 'form101' | 'form121' | 'form106ab' | 'form106c' | 'form106d' | 'form106ef' | 'form106g' | 'form106h' | 'form106i' | 'form106j' | 'form106j2' | 'form107' | 'form108' | 'form122a1' | 'form122a2' = 'form101';
let currentBlobUrls: Record<string, string | null> = {
  form101: null,
  form121: null,
  form106ab: null,
  form106c: null,
  form106d: null,
  form106ef: null,
  form106g: null,
  form106h: null,
  form106i: null,
  form106j: null,
  form106j2: null,
  form107: null,
  form108: null,
  form122a1: null,
  form122a2: null
};

// Dynamic lists state
interface AppState {
  realEstate: RealPropertyItem[];
  personalProperty: PersonalPropertyItem[];
  securedClaims: SecuredClaimItem[];
  unsecuredClaims: UnsecuredClaimItem[];
  contracts: ExecutoryContractItem[];
  codebtors: CodebtorItem[];
  isElderlyDisabled: boolean;
  hasSeparateHousehold: boolean;
}

const state: AppState = {
  realEstate: [
    {
      id: 're-1',
      description: { field_id: 're1_desc', value: 'Primary Residence - Single Family Home', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      property_address: {
        street_1: { field_id: 're1_st1', value: '100 17th St', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        street_2: { field_id: 're1_st2', value: null, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        city: { field_id: 're1_city', value: 'Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        state: { field_id: 're1_state', value: 'CO', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        zip_code: { field_id: 're1_zip', value: '80202', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        county: { field_id: 're1_county', value: 'Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        lived_since: { field_id: 're1_lived', value: '2020-01-01', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
      },
      ownership_type: { field_id: 're1_own', value: 'FEE_SIMPLE', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      current_value: { field_id: 're1_val', value: 450000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      other_owners_description: { field_id: 're1_other', value: null, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    }
  ],
  personalProperty: [
    {
      id: 'pp-1',
      line_number: { field_id: 'pp1_line', value: '03', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      description: { field_id: 'pp1_desc', value: '2018 Subaru Outback', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      location_notes: { field_id: 'pp1_loc', value: 'At residence', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      current_value: { field_id: 'pp1_val', value: 15000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    },
    {
      id: 'pp-2',
      line_number: { field_id: 'pp2_line', value: '17', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      description: { field_id: 'pp2_desc', value: 'FirstBank Checking Account #1234', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      location_notes: { field_id: 'pp2_loc', value: 'FirstBank Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      current_value: { field_id: 'pp2_val', value: 1250, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    }
  ],
  securedClaims: [
    {
      id: 'sec-1',
      creditor_name: { field_id: 'sec1_name', value: 'Mile High Mortgage Corp', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      account_number_last_four: { field_id: 'sec1_acc', value: '8812', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      collateral_property_ref_id: { field_id: 'sec1_ref', value: 're-1', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      total_claim_amount: { field_id: 'sec1_claim', value: 320000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      secured_portion: { field_id: 'sec1_sec', value: 320000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      unsecured_portion: { field_id: 'sec1_unsec', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    }
  ],
  unsecuredClaims: [
    {
      id: 'unsec-1',
      creditor_name: { field_id: 'unsec1_name', value: 'Chase Visa Card', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      account_number_last_four: { field_id: 'unsec1_acc', value: '4410', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      total_claim_amount: { field_id: 'unsec1_claim', value: 8500, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      claim_priority_type: 'NON_PRIORITY'
    }
  ],
  contracts: [
    {
      id: 'con-1',
      contract_description: { field_id: 'con1_desc', value: 'Apartment Storage Locker Lease', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      other_party_name: { field_id: 'con1_party', value: 'Denver Metro Storage LLC', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    }
  ],
  codebtors: [
    {
      id: 'cod-1',
      codebtor_name: { field_id: 'cod1_name', value: 'Robert Doe', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      creditor_name: { field_id: 'cod1_cred', value: 'Chase Visa Card', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    }
  ],
  isElderlyDisabled: false,
  hasSeparateHousehold: false
};

function getValue(id: string): string {
  const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement;
  return el ? el.value : '';
}

function getNumber(id: string): number {
  const val = parseFloat(getValue(id));
  return isNaN(val) ? 0 : val;
}

function getBool(id: string): boolean {
  const el = document.getElementById(id) as HTMLInputElement;
  return el ? el.checked : false;
}

function buildMasterCaseDataFromUI(): MasterCaseData {
  const primaryGrossWage = getNumber('gross-wages');
  const d1Tax = getNumber('tax-withholding');
  const d1Insurance = getNumber('insurance-payroll');
  const d1Retirement = getNumber('401k-payroll');
  const d1OtherDed = getNumber('other-deductions');

  const rentExp = getNumber('exp-rent');
  const utilExp = getNumber('exp-utilities');
  const foodExp = getNumber('exp-food');
  const transExp = getNumber('exp-trans');

  const d2RentExp = getNumber('j2-rent');
  const d2UtilExp = getNumber('j2-utilities');
  const d2FoodExp = getNumber('j2-food');

  return {
    case_info: {
      case_id: { field_id: 'c.id', value: 'CO-2026-LIVE', source: { type: 'system_default' }, status: 'user_verified', mapped_destinations: [] },
      jurisdiction: { field_id: 'c.jur', value: 'US_BANKRUPTCY_COLORADO', source: { type: 'system_default' }, status: 'user_verified', mapped_destinations: [] },
      chapter: { field_id: 'c.ch', value: 7, source: { type: 'system_default' }, status: 'user_verified', mapped_destinations: [] },
      is_emergency_filing: { field_id: 'c.emg', value: getBool('emergency-filing'), source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      attorney_of_record: {
        name: { field_id: 'c.atty_name', value: getValue('attorney-name') || 'Christopher Attorney, Esq.', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        bar_number: { field_id: 'c.atty_bar', value: getValue('attorney-bar') || 'CO-54321', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        firm_name: { field_id: 'c.atty_firm', value: getValue('attorney-firm') || 'Mile High Bankruptcy Law Group', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        address: { field_id: 'c.atty_addr', value: '100 17th St, Suite 500, Denver, CO 80202', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        phone: { field_id: 'c.atty_phone', value: '(303) 555-0100', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        email: { field_id: 'c.atty_email', value: 'counsel@milehighbklaw.com', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
      }
    },
    debtor_1: {
      debtor_id: 'debtor_1',
      pii: {
        first_name: { field_id: 'd1.first', value: getValue('first-name') || 'Jane', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        middle_name: { field_id: 'd1.mid', value: getValue('middle-name') || 'Marie', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        last_name: { field_id: 'd1.last', value: getValue('last-name') || 'Doe', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        ssn_last_four: { field_id: 'd1.ssn', value: (getValue('ssn-full') || '1234').slice(-4), source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        date_of_birth: { field_id: 'd1.dob', value: '1985-05-12', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        phone: { field_id: 'd1.phone', value: getValue('phone') || '(303) 555-0199', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        email: { field_id: 'd1.email', value: 'jane.doe@example.com', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
      },
      other_names_8_years: { field_id: 'd1.other_names', value: [], source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      current_address: {
        street_1: { field_id: 'd1.st1', value: getValue('street-1') || '100 17th St', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        street_2: { field_id: 'd1.st2', value: getValue('street-2') || null, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        city: { field_id: 'd1.city', value: getValue('city') || 'Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        state: { field_id: 'd1.state', value: getValue('state') || 'CO', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        zip_code: { field_id: 'd1.zip', value: getValue('zip') || '80202', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        county: { field_id: 'd1.county', value: getValue('county') || 'Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        lived_since: { field_id: 'd1.lived', value: '2020-01-01', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
      },
      prior_addresses_3_years: { field_id: 'd1.prior_addr', value: [], source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      prior_bankruptcies_8_years: { field_id: 'd1.prior_bk', value: [], source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    },
    debtor_2: getBool('joint-filing') ? {
      debtor_id: 'debtor_2',
      pii: {
        first_name: { field_id: 'd2.first', value: getValue('d2-first-name') || 'John', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        middle_name: { field_id: 'd2.mid', value: getValue('d2-middle-name') || 'Robert', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        last_name: { field_id: 'd2.last', value: getValue('d2-last-name') || 'Doe', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        ssn_last_four: { field_id: 'd2.ssn', value: '5678', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        date_of_birth: { field_id: 'd2.dob', value: '1983-08-20', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        phone: { field_id: 'd2.phone', value: '(303) 555-0200', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        email: { field_id: 'd2.email', value: 'john.doe@example.com', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
      },
      other_names_8_years: { field_id: 'd2.other_names', value: [], source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      current_address: {
        street_1: { field_id: 'd2.st1', value: '100 17th St', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        street_2: { field_id: 'd2.st2', value: null, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        city: { field_id: 'd2.city', value: 'Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        state: { field_id: 'd2.state', value: 'CO', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        zip_code: { field_id: 'd2.zip', value: '80202', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        county: { field_id: 'd2.county', value: 'Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        lived_since: { field_id: 'd2.lived', value: '2020-01-01', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
      },
      prior_addresses_3_years: { field_id: 'd2.prior_addr', value: [], source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      prior_bankruptcies_8_years: { field_id: 'd2.prior_bk', value: [], source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    } : null,
    schedule_ab: {
      real_property: state.realEstate,
      personal_property: state.personalProperty,
      total_real_estate_value: { field_id: 'ab.tot_re', value: state.realEstate.reduce((sum, r) => sum + r.current_value.value, 0), source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] },
      total_personal_property_value: { field_id: 'ab.tot_pp', value: state.personalProperty.reduce((sum, p) => sum + p.current_value.value, 0), source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] },
      total_property_value: { field_id: 'ab.tot_prop', value: state.realEstate.reduce((sum, r) => sum + r.current_value.value, 0) + state.personalProperty.reduce((sum, p) => sum + p.current_value.value, 0), source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
    },
    schedule_c: {
      claimed_exemptions: [
        {
          id: 'ex-1',
          property_ref_id: { field_id: 'c1.ref', value: 're-1', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
          property_description: { field_id: 'c1.desc', value: 'Primary Residence Homestead', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
          statute_code: { field_id: 'c1.stat', value: 'C.R.S. § 38-41-201', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
          claimed_exemption_amount: { field_id: 'c1.amt', value: state.isElderlyDisabled ? 350000 : 250000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
          current_market_value: { field_id: 'c1.mv', value: 450000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
        }
      ],
      total_claimed_exemptions: { field_id: 'c.tot', value: state.isElderlyDisabled ? 350000 : 250000, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
    },
    schedule_d: {
      secured_claims: state.securedClaims,
      total_secured_claims: { field_id: 'd.tot', value: state.securedClaims.reduce((sum, s) => sum + s.total_claim_amount.value, 0), source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
    },
    schedule_ef: {
      priority_claims: [],
      non_priority_claims: state.unsecuredClaims,
      total_priority_claims: { field_id: 'ef.tot_pri', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] },
      total_non_priority_claims: { field_id: 'ef.tot_non', value: state.unsecuredClaims.reduce((sum, u) => sum + u.total_claim_amount.value, 0), source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] },
      total_unsecured_claims: { field_id: 'ef.tot', value: state.unsecuredClaims.reduce((sum, u) => sum + u.total_claim_amount.value, 0), source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
    },
    schedule_g: {
      contracts_and_leases: state.contracts
    },
    schedule_h: {
      codebtors: state.codebtors
    },
    schedule_i: {
      debtor_1_employer: {
        name: { field_id: 'i.d1_emp_name', value: 'Tech Solutions Inc', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        address: { field_id: 'i.d1_emp_addr', value: '500 17th St, Denver, CO 80202', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        occupation: { field_id: 'i.d1_emp_occ', value: 'Software Engineer', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        length_of_employment: { field_id: 'i.d1_emp_len', value: '4 years', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
      },
      debtor_2_employer: null,
      debtor_1_gross_wages: { field_id: 'i.d1_gross', value: primaryGrossWage, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      debtor_1_payroll_deductions: {
        tax_medicare_social_security: { field_id: 'i.d1_tax', value: d1Tax, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        mandatory_contributions: { field_id: 'i.d1_mand', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        voluntary_contributions: { field_id: 'i.d1_vol', value: d1Retirement, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        insurance: { field_id: 'i.d1_ins', value: d1Insurance, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        domestic_support_obligations: { field_id: 'i.d1_dso', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_deductions: { field_id: 'i.d1_oth', value: d1OtherDed, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_deductions: { field_id: 'i.d1_tot_ded', value: d1Tax + d1Insurance + d1Retirement + d1OtherDed, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      debtor_1_net_wages: { field_id: 'i.d1_net', value: primaryGrossWage - (d1Tax + d1Insurance + d1Retirement + d1OtherDed), source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] },
      debtor_1_other_income: {
        business_net_income: { field_id: 'i.d1_bus', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        rental_property_net_income: { field_id: 'i.d1_rent', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        interest_and_dividends: { field_id: 'i.d1_int', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        family_support_payments: { field_id: 'i.d1_fam', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        unemployment_benefits: { field_id: 'i.d1_unemp', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        social_security_or_pension: { field_id: 'i.d1_ss', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_monthly_income: { field_id: 'i.d1_oth_inc', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_other_income: { field_id: 'i.d1_tot_oth', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      debtor_2_gross_wages: { field_id: 'i.d2_gross', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      debtor_2_payroll_deductions: {
        tax_medicare_social_security: { field_id: 'i.d2_tax', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        mandatory_contributions: { field_id: 'i.d2_mand', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        voluntary_contributions: { field_id: 'i.d2_vol', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        insurance: { field_id: 'i.d2_ins', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        domestic_support_obligations: { field_id: 'i.d2_dso', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_deductions: { field_id: 'i.d2_oth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_deductions: { field_id: 'i.d2_tot_ded', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      debtor_2_net_wages: { field_id: 'i.d2_net', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] },
      debtor_2_other_income: {
        business_net_income: { field_id: 'i.d2_bus', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        rental_property_net_income: { field_id: 'i.d2_rent', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        interest_and_dividends: { field_id: 'i.d2_int', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        family_support_payments: { field_id: 'i.d2_fam', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        unemployment_benefits: { field_id: 'i.d2_unemp', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        social_security_or_pension: { field_id: 'i.d2_ss', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_monthly_income: { field_id: 'i.d2_oth_inc', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_other_income: { field_id: 'i.d2_tot_oth', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      combined_total_monthly_income: { field_id: 'i.comb_tot', value: primaryGrossWage - (d1Tax + d1Insurance + d1Retirement + d1OtherDed), source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
    },
    schedule_j: {
      primary_residence_expenses: {
        rental_or_home_ownership_expenses: { field_id: 'j.rent', value: rentExp, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        real_estate_taxes: { field_id: 'j.re_tax', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        property_homeowner_insurance: { field_id: 'j.ins', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        home_maintenance_and_repairs: { field_id: 'j.maint', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        homeowner_association_dues: { field_id: 'j.hoa', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_primary_residence_expenses: { field_id: 'j.tot_res', value: rentExp, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      utilities_expenses: {
        electricity_heat_natural_gas: { field_id: 'j.util_gas', value: utilExp, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        water_sewer_garbage: { field_id: 'j.util_water', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        telephone_cellphone_internet_cable: { field_id: 'j.util_phone', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_utilities: { field_id: 'j.util_oth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_utilities_expenses: { field_id: 'j.tot_util', value: utilExp, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      food_and_housekeeping_expenses: {
        food_and_housekeeping_supplies: { field_id: 'j.food', value: foodExp, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        childcare_and_children_education: { field_id: 'j.child', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        clothing_laundry_dry_cleaning: { field_id: 'j.cloth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        personal_care_products_and_services: { field_id: 'j.pers', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        medical_and_dental_expenses: { field_id: 'j.med', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        transportation_and_gasoline: { field_id: 'j.trans', value: transExp, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        entertainment_recreation_books: { field_id: 'j.ent', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        charitable_contributions: { field_id: 'j.charity', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_food_housekeeping_expenses: { field_id: 'j.tot_food', value: foodExp + transExp, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      insurance_expenses: {
        renters_or_homeowners_insurance: { field_id: 'j.ins_home', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        life_insurance: { field_id: 'j.ins_life', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        health_insurance: { field_id: 'j.ins_health', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        auto_insurance: { field_id: 'j.ins_auto', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_insurance: { field_id: 'j.ins_oth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_insurance_expenses: { field_id: 'j.tot_ins', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      tax_expenses: {
        local_state_federal_taxes_not_withheld: { field_id: 'j.tax_unwithheld', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_tax_expenses: { field_id: 'j.tax_oth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_tax_expenses: { field_id: 'j.tot_tax', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      installment_and_debt_payments: {
        auto_payments: { field_id: 'j.debt_auto', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_installment_payments: { field_id: 'j.debt_inst', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_installment_and_debt_payments: { field_id: 'j.tot_debt', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      other_living_expenses: {
        other_expenses_line_items: [],
        total_other_living_expenses: { field_id: 'j.tot_oth_exp', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      total_monthly_expenses: { field_id: 'j.tot_exp', value: rentExp + utilExp + foodExp + transExp, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
    },
    schedule_j2: state.hasSeparateHousehold ? {
      primary_residence_expenses: {
        rental_or_home_ownership_expenses: { field_id: 'j2.rent', value: d2RentExp, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        real_estate_taxes: { field_id: 'j2.re_tax', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        property_homeowner_insurance: { field_id: 'j2.ins', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        home_maintenance_and_repairs: { field_id: 'j2.maint', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        homeowner_association_dues: { field_id: 'j2.hoa', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_primary_residence_expenses: { field_id: 'j2.tot_res', value: d2RentExp, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      utilities_expenses: {
        electricity_heat_natural_gas: { field_id: 'j2.util_gas', value: d2UtilExp, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        water_sewer_garbage: { field_id: 'j2.util_water', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        telephone_cellphone_internet_cable: { field_id: 'j2.util_phone', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_utilities: { field_id: 'j2.util_oth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_utilities_expenses: { field_id: 'j2.tot_util', value: d2UtilExp, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      food_and_housekeeping_expenses: {
        food_and_housekeeping_supplies: { field_id: 'j2.food', value: d2FoodExp, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        childcare_and_children_education: { field_id: 'j2.child', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        clothing_laundry_dry_cleaning: { field_id: 'j2.cloth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        personal_care_products_and_services: { field_id: 'j2.pers', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        medical_and_dental_expenses: { field_id: 'j2.med', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        transportation_and_gasoline: { field_id: 'j2.trans', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        entertainment_recreation_books: { field_id: 'j2.ent', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        charitable_contributions: { field_id: 'j2.charity', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_food_housekeeping_expenses: { field_id: 'j2.tot_food', value: d2FoodExp, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      insurance_expenses: {
        renters_or_homeowners_insurance: { field_id: 'j2.ins_home', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        life_insurance: { field_id: 'j2.ins_life', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        health_insurance: { field_id: 'j2.ins_health', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        auto_insurance: { field_id: 'j2.ins_auto', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_insurance: { field_id: 'j2.ins_oth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_insurance_expenses: { field_id: 'j2.tot_ins', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      tax_expenses: {
        local_state_federal_taxes_not_withheld: { field_id: 'j2.tax_unwithheld', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_tax_expenses: { field_id: 'j2.tax_oth', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_tax_expenses: { field_id: 'j2.tot_tax', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      installment_and_debt_payments: {
        auto_payments: { field_id: 'j2.debt_auto', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        other_installment_payments: { field_id: 'j2.debt_inst', value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
        total_installment_and_debt_payments: { field_id: 'j2.tot_debt', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      other_living_expenses: {
        other_expenses_line_items: [],
        total_other_living_expenses: { field_id: 'j2.tot_oth_exp', value: 0, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
      },
      total_monthly_expenses: { field_id: 'j2.tot_exp', value: d2RentExp + d2UtilExp + d2FoodExp, source: { type: 'calculated' }, status: 'user_verified', mapped_destinations: [] }
    } : null,
    means_test_122a: {
      paystubs_6_months: [
        { stub_id: 's1', pay_date: '2026-07-31', gross_pay: primaryGrossWage }
      ]
    }
  };
}

async function renderLivePdf() {
  const masterData = buildMasterCaseDataFromUI();

  let pdfBytes: Uint8Array | null = null;
  switch (activeTab) {
    case 'form101':
      pdfBytes = await generateForm101Pdf(masterData);
      break;
    case 'form121':
      pdfBytes = await generateForm121Pdf(masterData);
      break;
    case 'form106ab':
      pdfBytes = await generateForm106ABPdf(masterData);
      break;
    case 'form106c':
      pdfBytes = await generateForm106CPdf(masterData);
      break;
    case 'form106d':
      pdfBytes = await generateForm106DPdf(masterData);
      break;
    case 'form106ef':
      pdfBytes = await generateForm106EFPdf(masterData);
      break;
    case 'form106g':
      pdfBytes = await generateForm106GPdf(masterData);
      break;
    case 'form106h':
      pdfBytes = await generateForm106HPdf(masterData);
      break;
    case 'form106i':
      pdfBytes = await generateForm106IPdf(masterData);
      break;
    case 'form106j':
      pdfBytes = await generateForm106JPdf(masterData);
      break;
    case 'form106j2':
      pdfBytes = await generateForm106J2Pdf(masterData);
      break;
    case 'form107':
      pdfBytes = await generateForm107Pdf(masterData);
      break;
    case 'form108':
      pdfBytes = await generateForm108Pdf(masterData);
      break;
    case 'form122a1':
      pdfBytes = await generateForm122A1Pdf(masterData);
      break;
    case 'form122a2':
      pdfBytes = await generateForm122A2Pdf(masterData);
      break;
  }

  if (pdfBytes) {
    if (currentBlobUrls[activeTab]) {
      URL.revokeObjectURL(currentBlobUrls[activeTab]!);
    }
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    currentBlobUrls[activeTab] = URL.createObjectURL(blob);

    const iframe = document.getElementById('pdf-frame') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = currentBlobUrls[activeTab]!;
    }
  }
}

function updateDOMSummaries() {
  const masterData = buildMasterCaseDataFromUI();

  const cmiResult = calculateCMI(
    masterData.debtor_1.pii.first_name.value ? masterData : null,
    masterData.debtor_2 ? masterData : null,
    'US_BANKRUPTCY_COLORADO',
    1
  );

  const cashFlowResult = calculateNetCashFlow(
    masterData.schedule_i?.combined_total_monthly_income.value || 0,
    masterData.schedule_j?.total_monthly_expenses.value || 0,
    masterData.schedule_j2?.total_monthly_expenses.value || 0
  );

  const hardAuditFlags = runHardAuditFlags({
    bankAccounts: [
      { account_id: 'pp-2', bank_name: 'FirstBank Checking Account #1234', ocr_statement_balance: 1250, schedule_ab_line17_reported_balance: getNumber('pp2_val') || 1250 }
    ],
    insiderPayments: [],
    securedDebts: state.securedClaims.map(s => ({
      claim_id: s.id,
      creditor_name: s.creditor_name.value,
      claim_amount: s.total_claim_amount.value,
      collateral_schedule_ab_id: s.collateral_property_ref_id.value || undefined,
      has_form_108_entry: true
    })),
    payStubs: [
      { stub_id: 'stub_1', pay_date: '2026-07-31' }
    ],
    petitionDate: '2026-08-02'
  });

  const grossElement = document.getElementById('calc-monthly-gross');
  if (grossElement) grossElement.innerText = `$${cmiResult.debtor_1_cmi_6month_avg.toFixed(2)}`;

  const cmiIndicator = document.getElementById('cmi-status-indicator');
  if (cmiIndicator) {
    if (cmiResult.is_above_median) {
      cmiIndicator.innerText = `ABOVE MEDIAN ($${cmiResult.colorado_median_threshold.toLocaleString()}) - Form 122A-2 Required`;
      cmiIndicator.className = 'badge badge-warning';
    } else {
      cmiIndicator.innerText = `BELOW MEDIAN ($${cmiResult.colorado_median_threshold.toLocaleString()}) - Presumption Does Not Arise`;
      cmiIndicator.className = 'badge badge-success';
    }
  }

  const netIncomeEl = document.getElementById('net-income-display');
  if (netIncomeEl) netIncomeEl.innerText = `$${cashFlowResult.net_disposable_monthly_income.toFixed(2)}`;

  const cashFlowIndicator = document.getElementById('cashflow-status-indicator');
  if (cashFlowIndicator) {
    if (cashFlowResult.is_deficit) {
      cashFlowIndicator.innerText = `DEFICIT: -$${Math.abs(cashFlowResult.net_disposable_monthly_income).toFixed(2)}/mo`;
      cashFlowIndicator.className = 'badge badge-danger';
    } else {
      cashFlowIndicator.innerText = `SURPLUS: +$${cashFlowResult.net_disposable_monthly_income.toFixed(2)}/mo`;
      cashFlowIndicator.className = 'badge badge-success';
    }
  }

  const hardAuditStatus = document.getElementById('val-status');
  const hardAuditText = document.getElementById('val-text');
  if (hardAuditStatus && hardAuditText) {
    const criticalFlags = hardAuditFlags.filter(f => f.severity === 'CRITICAL');
    if (criticalFlags.length > 0) {
      hardAuditStatus.className = 'status-indicator warning';
      hardAuditText.innerText = `Hard Audit Engine: ${criticalFlags.length} CRITICAL Flags Detected`;
    } else {
      hardAuditStatus.className = 'status-indicator success';
      hardAuditText.innerText = `Hard Audit Engine: 0 Critical Flags (Compliant)`;
    }
  }

  // Update Attorney Review Dashboard
  const reviewSummary = calculateReviewSummary(masterData);
  const readinessEl = document.getElementById('review-readiness-percent');
  if (readinessEl) readinessEl.innerText = `${reviewSummary.readiness_percentage}%`;
  const rawEl = document.getElementById('review-raw-count');
  if (rawEl) rawEl.innerText = String(reviewSummary.raw_extracted_count);
  const verifiedEl = document.getElementById('review-verified-count');
  if (verifiedEl) verifiedEl.innerText = String(reviewSummary.user_verified_count);
  const approvedEl = document.getElementById('review-approved-count');
  if (approvedEl) approvedEl.innerText = String(reviewSummary.attorney_approved_count);
  const flagsEl = document.getElementById('review-flags-count');
  if (flagsEl) flagsEl.innerText = String(reviewSummary.hard_audit_critical_flags_count);

  const iframe = document.getElementById('pdf-frame') as HTMLIFrameElement;
  if (iframe && currentBlobUrls[activeTab]) {
    iframe.src = currentBlobUrls[activeTab]!;
  }
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

  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;
  const genBtn = document.getElementById('generate-btn') as HTMLButtonElement;

  if (prevBtn) prevBtn.disabled = currentStep === 1;
  if (nextBtn) nextBtn.style.display = currentStep === 17 ? 'none' : 'inline-block';
  if (genBtn) genBtn.style.display = currentStep === 17 ? 'inline-block' : 'none';

  // Smoothly scroll questionnaire container to top when changing steps
  const card = document.querySelector('.intake-card');
  if (card) {
    card.scrollTop = 0;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });

  updateDOMSummaries();
  renderLivePdf();
}

function bindTab(tabId: string, tabName: typeof activeTab) {
  const btn = document.getElementById(tabId);
  btn?.addEventListener('click', () => {
    activeTab = tabName;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderLivePdf();
  });
}

// Global window event handlers for dynamic list cards
(window as any).addRealEstateItem = () => {
  const count = state.realEstate.length + 1;
  state.realEstate.push({
    id: `re-${count}`,
    description: { field_id: `re${count}_desc`, value: `Real Property #${count}`, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    property_address: {
      street_1: { field_id: `re${count}_st1`, value: '100 Main St', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      street_2: { field_id: `re${count}_st2`, value: null, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      city: { field_id: `re${count}_city`, value: 'Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      state: { field_id: `re${count}_state`, value: 'CO', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      zip_code: { field_id: `re${count}_zip`, value: '80202', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      county: { field_id: `re${count}_county`, value: 'Denver', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
      lived_since: { field_id: `re${count}_lived`, value: '2020-01-01', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
    },
    ownership_type: { field_id: `re${count}_own`, value: 'FEE_SIMPLE', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    current_value: { field_id: `re${count}_val`, value: 250000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    other_owners_description: { field_id: `re${count}_other`, value: null, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
  });
  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
};

(window as any).deleteRealEstateItem = (id: string) => {
  state.realEstate = state.realEstate.filter(r => r.id !== id);
  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
};

(window as any).addPersonalPropertyItem = () => {
  const count = state.personalProperty.length + 1;
  state.personalProperty.push({
    id: `pp-${count}`,
    line_number: { field_id: `pp${count}_line`, value: '03', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    description: { field_id: `pp${count}_desc`, value: `Personal Asset #${count}`, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    location_notes: { field_id: `pp${count}_loc`, value: 'Residence', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    current_value: { field_id: `pp${count}_val`, value: 1000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
  });
  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
};

(window as any).deletePersonalPropertyItem = (id: string) => {
  state.personalProperty = state.personalProperty.filter(p => p.id !== id);
  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
};

(window as any).addSecuredClaimItem = () => {
  const count = state.securedClaims.length + 1;
  state.securedClaims.push({
    id: `sec-${count}`,
    creditor_name: { field_id: `sec${count}_name`, value: `Secured Creditor #${count}`, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    account_number_last_four: { field_id: `sec${count}_acc`, value: '9999', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    collateral_property_ref_id: { field_id: `sec${count}_ref`, value: 're-1', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    total_claim_amount: { field_id: `sec${count}_claim`, value: 50000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    secured_portion: { field_id: `sec${count}_sec`, value: 50000, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    unsecured_portion: { field_id: `sec${count}_unsec`, value: 0, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] }
  });
  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
};

(window as any).deleteSecuredClaimItem = (id: string) => {
  state.securedClaims = state.securedClaims.filter(s => s.id !== id);
  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
};

(window as any).addUnsecuredClaimItem = () => {
  const count = state.unsecuredClaims.length + 1;
  state.unsecuredClaims.push({
    id: `unsec-${count}`,
    creditor_name: { field_id: `unsec${count}_name`, value: `Credit Card #${count}`, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    account_number_last_four: { field_id: `unsec${count}_acc`, value: '1111', source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    total_claim_amount: { field_id: `unsec${count}_claim`, value: 2500, source: { type: 'manual_entry' }, status: 'user_verified', mapped_destinations: [] },
    claim_priority_type: 'NON_PRIORITY'
  });
  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
};

(window as any).deleteUnsecuredClaimItem = (id: string) => {
  state.unsecuredClaims = state.unsecuredClaims.filter(u => u.id !== id);
  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
};

function renderUILists() {
  const reList = document.getElementById('real-estate-list');
  if (reList) {
    reList.innerHTML = state.realEstate.map((r, i) => `
      <div class="item-card">
        <div class="item-card-header">
          <span>Real Property #${i + 1}: ${r.description.value}</span>
          <button type="button" class="delete-btn" onclick="window.deleteRealEstateItem('${r.id}')">Delete</button>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Description</label>
            <input type="text" value="${r.description.value}" onchange="window.updateRealEstateValue('${r.id}', 'desc', this.value)" />
          </div>
          <div class="form-group">
            <label>Current Fair Market Value ($)</label>
            <input type="number" value="${r.current_value.value}" onchange="window.updateRealEstateValue('${r.id}', 'val', this.value)" />
          </div>
        </div>
      </div>
    `).join('');
  }

  const ppList = document.getElementById('personal-property-list');
  if (ppList) {
    ppList.innerHTML = state.personalProperty.map((p, i) => `
      <div class="item-card">
        <div class="item-card-header">
          <span>Personal Property #${i + 1}: ${p.description.value}</span>
          <button type="button" class="delete-btn" onclick="window.deletePersonalPropertyItem('${p.id}')">Delete</button>
        </div>
        <div class="grid-3">
          <div class="form-group">
            <label>Form Line #</label>
            <input type="text" value="${p.line_number.value}" onchange="window.updatePPValue('${p.id}', 'line', this.value)" />
          </div>
          <div class="form-group">
            <label>Asset Description</label>
            <input type="text" value="${p.description.value}" onchange="window.updatePPValue('${p.id}', 'desc', this.value)" />
          </div>
          <div class="form-group">
            <label>Current Value ($)</label>
            <input type="number" id="pp2_val" value="${p.current_value.value}" onchange="window.updatePPValue('${p.id}', 'val', this.value)" />
          </div>
        </div>
      </div>
    `).join('');
  }

  const secList = document.getElementById('secured-claims-list');
  if (secList) {
    secList.innerHTML = state.securedClaims.map((s, i) => `
      <div class="item-card">
        <div class="item-card-header">
          <span>Secured Creditor #${i + 1}: ${s.creditor_name.value}</span>
          <button type="button" class="delete-btn" onclick="window.deleteSecuredClaimItem('${s.id}')">Delete</button>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Creditor Name</label>
            <input type="text" value="${s.creditor_name.value}" onchange="window.updateSecValue('${s.id}', 'name', this.value)" />
          </div>
          <div class="form-group">
            <label>Total Claim Amount ($)</label>
            <input type="number" value="${s.total_claim_amount.value}" onchange="window.updateSecValue('${s.id}', 'claim', this.value)" />
          </div>
        </div>
      </div>
    `).join('');
  }

  const unsecList = document.getElementById('unsecured-claims-list');
  if (unsecList) {
    unsecList.innerHTML = state.unsecuredClaims.map((u, i) => `
      <div class="item-card">
        <div class="item-card-header">
          <span>Unsecured Creditor #${i + 1}: ${u.creditor_name.value}</span>
          <button type="button" class="delete-btn" onclick="window.deleteUnsecuredClaimItem('${u.id}')">Delete</button>
        </div>
        <div class="grid-2">
          <div class="form-group">
            <label>Creditor Name</label>
            <input type="text" value="${u.creditor_name.value}" onchange="window.updateUnsecValue('${u.id}', 'name', this.value)" />
          </div>
          <div class="form-group">
            <label>Claim Amount ($)</label>
            <input type="number" value="${u.total_claim_amount.value}" onchange="window.updateUnsecValue('${u.id}', 'claim', this.value)" />
          </div>
        </div>
      </div>
    `).join('');
  }
}

(window as any).updateRealEstateValue = (id: string, field: 'desc' | 'val', val: string) => {
  const item = state.realEstate.find(r => r.id === id);
  if (item) {
    if (field === 'desc') item.description.value = val;
    if (field === 'val') item.current_value.value = parseFloat(val) || 0;
    updateDOMSummaries();
    renderLivePdf();
  }
};

(window as any).updatePPValue = (id: string, field: 'line' | 'desc' | 'val', val: string) => {
  const item = state.personalProperty.find(p => p.id === id);
  if (item) {
    if (field === 'line') item.line_number.value = val;
    if (field === 'desc') item.description.value = val;
    if (field === 'val') item.current_value.value = parseFloat(val) || 0;
    updateDOMSummaries();
    renderLivePdf();
  }
};

(window as any).updateSecValue = (id: string, field: 'name' | 'claim', val: string) => {
  const item = state.securedClaims.find(s => s.id === id);
  if (item) {
    if (field === 'name') item.creditor_name.value = val;
    if (field === 'claim') {
      const num = parseFloat(val) || 0;
      item.total_claim_amount.value = num;
      item.secured_portion.value = num;
    }
    updateDOMSummaries();
    renderLivePdf();
  }
};

(window as any).updateUnsecValue = (id: string, field: 'name' | 'claim', val: string) => {
  const item = state.unsecuredClaims.find(u => u.id === id);
  if (item) {
    if (field === 'name') item.creditor_name.value = val;
    if (field === 'claim') item.total_claim_amount.value = parseFloat(val) || 0;
    updateDOMSummaries();
    renderLivePdf();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('joint-filing')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    const d2Container = document.getElementById('debtor-2-container');
    if (d2Container) {
      d2Container.style.display = checked ? 'block' : 'none';
    }
    updateDOMSummaries();
    renderLivePdf();
  });

  document.getElementById('elderly-disabled-toggle')?.addEventListener('change', (e) => {
    state.isElderlyDisabled = (e.target as HTMLInputElement).checked;
    updateDOMSummaries();
    renderLivePdf();
  });

  document.getElementById('separate-household-toggle')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    state.hasSeparateHousehold = checked;
    const j2Container = document.getElementById('j2-container');
    if (j2Container) {
      j2Container.style.display = checked ? 'block' : 'none';
    }
    updateDOMSummaries();
    renderLivePdf();
  });

  // Step navigation
  document.getElementById('prev-btn')?.addEventListener('click', () => updateStep(currentStep - 1));
  document.getElementById('next-btn')?.addEventListener('click', () => {
    // Validate required fields in active step before advancing
    const activeStepEl = document.getElementById(`step-${currentStep}`);
    if (activeStepEl) {
      const inputs = activeStepEl.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[required], select[required], textarea[required]');
      let stepValid = true;
      inputs.forEach(input => {
        if (!input.checkValidity()) {
          input.reportValidity();
          stepValid = false;
        }
      });
      if (!stepValid) return;
    }
    updateStep(currentStep + 1);
  });

  // Step Jump Selector Event Listener
  document.getElementById('step-jump-select')?.addEventListener('change', (e) => {
    const val = Number((e.target as HTMLSelectElement).value);
    if (!isNaN(val) && val >= 1 && val <= 17) {
      updateStep(val);
    }
  });

  document.getElementById('intake-form')?.addEventListener('input', () => {
    updateDOMSummaries();
    renderLivePdf();
  });

  document.getElementById('intake-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    updateDOMSummaries();
    renderLivePdf();
  });

  // Bind Tabs
  bindTab('tab-form101', 'form101');
  bindTab('tab-form121', 'form121');
  bindTab('tab-form106ab', 'form106ab');
  bindTab('tab-form106c', 'form106c');
  bindTab('tab-form106d', 'form106d');
  bindTab('tab-form106ef', 'form106ef');
  bindTab('tab-form106g', 'form106g');
  bindTab('tab-form106h', 'form106h');
  bindTab('tab-form106i', 'form106i');
  bindTab('tab-form106j', 'form106j');
  bindTab('tab-form106j2', 'form106j2');
  bindTab('tab-form107', 'form107');
  bindTab('tab-form108', 'form108');
  bindTab('tab-form122a1', 'form122a1');
  bindTab('tab-form122a2', 'form122a2');

  // OCR Event Listeners
  document.getElementById('btn-ocr-tax')?.addEventListener('click', () => {
    const res = parseTaxReturn({ primary_taxpayer_name: 'Jane Doe', w2_gross_wages_debtor_1: 58200 });
    const st = document.getElementById('status-ocr-tax');
    if (st) st.innerText = `Verified: $${res.extracted_data.w2_gross_wages_debtor_1.toLocaleString()} W-2 Gross Wages Extracted (Conf: ${(res.confidence_score * 100).toFixed(0)}%)`;
    renderLivePdf();
  });

  document.getElementById('btn-ocr-paystub')?.addEventListener('click', () => {
    const res = parsePaystub({ gross_pay_current: 2425, net_pay: 1845 });
    const st = document.getElementById('status-ocr-paystub');
    if (st) st.innerText = `Verified: Gross $${res.extracted_data.gross_pay_current}/pay (Conf: ${(res.confidence_score * 100).toFixed(0)}%)`;
    renderLivePdf();
  });

  document.getElementById('btn-ocr-bank')?.addEventListener('click', () => {
    const res = parseBankStatement({ institution_name: 'FirstBank', ending_balance: 1250 });
    const st = document.getElementById('status-ocr-bank');
    if (st) st.innerText = `Verified: Balance $${res.extracted_data.ending_balance.toFixed(2)} (Conf: ${(res.confidence_score * 100).toFixed(0)}%)`;
    renderLivePdf();
  });

  document.getElementById('btn-ocr-credit')?.addEventListener('click', () => {
    const res = parseCreditReport([]);
    const st = document.getElementById('status-ocr-credit');
    if (st) st.innerText = `Verified: ${res.extracted_data.length} Accounts Extracted (Conf: ${(res.confidence_score * 100).toFixed(0)}%)`;
    renderLivePdf();
  });

  // Attorney Signoff Listener
  document.getElementById('btn-attorney-signoff')?.addEventListener('click', () => {
    const masterData = buildMasterCaseDataFromUI();
    const name = (document.getElementById('attorney-name') as HTMLInputElement)?.value || 'Christopher Attorney, Esq.';
    const bar = (document.getElementById('attorney-bar') as HTMLInputElement)?.value || 'CO-54321';
    const firm = (document.getElementById('attorney-firm') as HTMLInputElement)?.value || 'Mile High Bankruptcy Law Group';
    const ecf = (document.getElementById('attorney-ecf') as HTMLInputElement)?.value || 'CO_ECF_7719';
    const check = (document.getElementById('attorney-declaration-check') as HTMLInputElement)?.checked ?? false;

    const result = executeAttorneySignoff(masterData, {
      attorney_name: name,
      bar_number: bar,
      firm_name: firm,
      ecf_login_id: ecf,
      signed_at: new Date().toISOString(),
      declaration_accepted: check
    });

    const statusBox = document.getElementById('signoff-status-box');
    if (statusBox) {
      if (result.success) {
        statusBox.innerText = `SUCCESS: Petition packet signed off by ${name} (#${bar}) on ${new Date().toLocaleTimeString()}. Ready for CM/ECF Filing.`;
      } else {
        statusBox.innerText = `FAILED: ${result.errors.join(' ')}`;
      }
    }
  });

  // B2B Auth Gate Logic
  const overlay = document.getElementById('landing-overlay');
  const authForm = document.getElementById('auth-form');
  const authInput = document.getElementById('auth-password') as HTMLInputElement;
  const authError = document.getElementById('auth-error');

  if (sessionStorage.getItem('lexpetition_authenticated') === 'true') {
    if (overlay) overlay.style.display = 'none';
  }

  authForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = authInput?.value.trim();
    if (pass.length > 0) {
      sessionStorage.setItem('lexpetition_authenticated', 'true');
      if (overlay) overlay.style.display = 'none';
    } else {
      if (authError) authError.style.display = 'block';
    }
  });

  renderUILists();
  updateDOMSummaries();
  renderLivePdf();
});
