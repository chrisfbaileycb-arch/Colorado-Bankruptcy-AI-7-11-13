import { FieldWrapper, VerificationStatus, FieldSource } from '../../types/master-case';

export interface ExtractedTaxReturn {
  tax_year: number;
  filing_status: 'SINGLE' | 'MARRIED_FILING_JOINTLY' | 'MARRIED_FILING_SEPARATELY' | 'HEAD_OF_HOUSEHOLD';
  primary_taxpayer_name: string;
  spouse_name?: string;
  w2_gross_wages_debtor_1: number;
  w2_gross_wages_debtor_2: number;
  adjusted_gross_income: number;
  total_tax: number;
  employer_name_debtor_1: string;
  employer_name_debtor_2?: string;
}

export interface ExtractedPaystub {
  debtor_index: 1 | 2;
  employee_name: string;
  employer_name: string;
  pay_period_start: string;
  pay_period_end: string;
  check_date: string;
  gross_pay_current: number;
  gross_pay_ytd: number;
  net_pay: number;
  deductions: {
    federal_tax: number;
    state_tax: number;
    social_security: number;
    medicare: number;
    four_oh_one_k: number;
    health_insurance: number;
    garnishments: number;
    other: number;
  };
}

export interface ExtractedBankStatement {
  institution_name: string;
  account_number_last4: string;
  account_type: 'CHECKING' | 'SAVINGS' | 'MONEY_MARKET';
  statement_end_date: string;
  ending_balance: number;
  average_daily_balance: number;
  total_deposits: number;
  total_withdrawals: number;
}

export interface ExtractedCreditReportItem {
  creditor_name: string;
  account_number_masked: string;
  account_type: 'AUTO_LOAN' | 'MORTGAGE' | 'CREDIT_CARD' | 'PERSONAL_LOAN' | 'COLLECTION' | 'TAX_LIEN';
  is_secured: boolean;
  collateral_description?: string;
  current_balance: number;
  monthly_payment: number;
  past_due_amount: number;
  date_opened: string;
  high_credit_limit: number;
  account_status: 'OPEN' | 'CLOSED' | 'CHARGE_OFF' | 'COLLECTION';
  has_codebtor: boolean;
  codebtor_name?: string;
}

export interface ExtractionResult<T> {
  extracted_data: T;
  confidence_score: number;
  source_filename: string;
  warnings: string[];
}
