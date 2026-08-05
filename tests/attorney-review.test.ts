import { describe, expect, it } from 'bun:test';
import { createSampleMasterCaseData } from './helpers/sample-case';
import {
  extractAllFieldWrappers,
  calculateReviewSummary,
  applyFieldOverride,
  executeAttorneySignoff
} from '../lib/engine/review';
import type { FieldOverride, AttorneySignoff } from '../lib/engine/review/types';
import { executeSelfReviewCompletion } from '../lib/engine/review';

describe('Phase 8: Attorney Review Console Test Suite', () => {
  it('1. extractAllFieldWrappers traverses MasterCaseData SSOT and extracts field wrappers', () => {
    const data = createSampleMasterCaseData();
    const wrappers = extractAllFieldWrappers(data);

    expect(wrappers.length).toBeGreaterThan(10);
    expect(wrappers.some(w => w.field_id === 'first')).toBe(true);
  });

  it('2. calculateReviewSummary computes readiness percentage and flag counts accurately', () => {
    const data = createSampleMasterCaseData();
    const summary = calculateReviewSummary(data);

    expect(summary.total_fields).toBeGreaterThan(0);
    expect(summary.readiness_percentage).toBeGreaterThanOrEqual(0);
    expect(summary.can_execute_signoff).toBe(false);
  });

  it('3. applyFieldOverride modifies field value, updates status to attorney_approved, and logs rationale note', () => {
    const data = createSampleMasterCaseData();
    const override: FieldOverride = {
      field_id: 'first',
      original_value: 'Jane',
      overridden_value: 'Janet',
      attorney_reason: 'Corrected legal first name per passport',
      attorney_name: 'Example Supervising Attorney',
      bar_number: 'TEST-BAR-54321',
      timestamp: '2026-08-02T16:30:00Z'
    };

    const res = applyFieldOverride(data, override);
    expect(res.success).toBe(true);

    const firstWrapper = res.updated_data.debtor_1.first_name;
    expect(firstWrapper?.value).toBe('Janet');
    expect(firstWrapper?.status).toBe('attorney_approved');
    expect(firstWrapper?.attorney_notes).toBe('Corrected legal first name per passport');
  });

  it('4. executeAttorneySignoff rejects signoff if declaration is not accepted', () => {
    const data = createSampleMasterCaseData();
    const signoff: AttorneySignoff = {
      attorney_name: 'Example Supervising Attorney',
      bar_number: 'TEST-BAR-54321',
      firm_name: 'Example Law Firm',
      ecf_login_id: 'TEST_ECF_NOT_REAL',
      signed_at: new Date().toISOString(),
      declaration_accepted: false
    };

    const res = executeAttorneySignoff(data, signoff);
    expect(res.success).toBe(false);
    expect(res.errors.some(e => e.includes('review confirmation'))).toBe(true);
  });

  it('5. executeAttorneySignoff rejects signoff if bar number is invalid', () => {
    const data = createSampleMasterCaseData();
    const signoff: AttorneySignoff = {
      attorney_name: 'Example Supervising Attorney',
      bar_number: '12',
      firm_name: 'Example Law Firm',
      ecf_login_id: 'TEST_ECF_NOT_REAL',
      signed_at: new Date().toISOString(),
      declaration_accepted: true
    };

    const res = executeAttorneySignoff(data, signoff);
    expect(res.success).toBe(false);
    expect(res.errors.some(e => e.includes('valid Attorney Bar Number'))).toBe(true);
  });

  it('6. partitioned review can replace repetitive field-by-field approval when the signing attorney covers every intake step', () => {
    const data = createSampleMasterCaseData();
    const signoff: AttorneySignoff = {
      attorney_name: 'Example Supervising Attorney',
      bar_number: 'TEST-BAR-54321',
      firm_name: 'Example Law Firm',
      ecf_login_id: 'TEST_ECF_NOT_REAL',
      signed_at: new Date().toISOString(),
      declaration_accepted: true,
      review_mode: 'PARTITIONED',
      partition_approvals: [
        { step_start: 1, step_end: 10, attorney_name: 'Example Supervising Attorney', bar_number: 'TEST-BAR-54321', approved_at: new Date().toISOString(), note: 'Delegated intake partition reviewed under firm policy.' },
        { step_start: 11, step_end: 16, attorney_name: 'Example Supervising Attorney', bar_number: 'TEST-BAR-54321', approved_at: new Date().toISOString(), note: 'Remaining intake partition reviewed before final signoff.' }
      ]
    };

    const res = executeAttorneySignoff(data, signoff);
    expect(res.success).toBe(true);
  });

  it('7. partitioned attorney review rejects gaps in step coverage', () => {
    const data = createSampleMasterCaseData();
    const signoff: AttorneySignoff = {
      attorney_name: 'Example Supervising Attorney',
      bar_number: 'TEST-BAR-54321',
      firm_name: 'Example Law Firm',
      ecf_login_id: 'TEST_ECF_NOT_REAL',
      signed_at: new Date().toISOString(),
      declaration_accepted: true,
      review_mode: 'PARTITIONED',
      partition_approvals: [
        { step_start: 1, step_end: 10, attorney_name: 'Example Supervising Attorney', bar_number: 'TEST-BAR-54321', approved_at: new Date().toISOString(), note: 'Approved first partition.' }
      ]
    };

    const res = executeAttorneySignoff(data, signoff);
    expect(res.success).toBe(false);
    expect(res.errors.some(error => error.includes('does not cover intake step'))).toBe(true);
  });

  it('8. self-represented review never creates an attorney signoff', () => {
    const data = createSampleMasterCaseData();
    const res = executeSelfReviewCompletion(data, {
      reviewer_name: 'Example Debtor',
      completed_at: new Date().toISOString(),
      declaration_accepted: true,
      step_start: 1,
      step_end: 16
    });
    expect(res.success).toBe(true);
    expect(res.review_label).toBe('SELF_REPRESENTED_REVIEW');
    expect(res.summary.signoff_details).toBeUndefined();
  });

  it('9. executeAttorneySignoff completes successfully when field-by-field prerequisites pass', () => {
    const data = createSampleMasterCaseData();
    for (const field of extractAllFieldWrappers(data)) field.status = 'attorney_approved';
    const signoff: AttorneySignoff = {
      attorney_name: 'Example Supervising Attorney',
      bar_number: 'TEST-BAR-54321',
      firm_name: 'Example Law Firm',
      ecf_login_id: 'TEST_ECF_NOT_REAL',
      signed_at: new Date().toISOString(),
      declaration_accepted: true
    };

    const res = executeAttorneySignoff(data, signoff);
    expect(res.success).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.summary.signoff_details?.attorney_name).toBe('Example Supervising Attorney');

    const wrappers = extractAllFieldWrappers(data);
    expect(wrappers.every(w => w.status === 'attorney_approved')).toBe(true);
  });
});
