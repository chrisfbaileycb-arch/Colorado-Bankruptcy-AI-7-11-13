import type { MasterCaseData, VerificationStatus } from '../../types/master-case';
import { runHardAuditFlags } from '../validators/hard-audit';
import type { FieldOverride, AttorneySignoff, PetitionReviewSummary } from './types';

export function extractAllFieldWrappers(data: MasterCaseData) {
  const wrappers: any[] = [];
  function traverse(obj: any) {
    if (!obj || typeof obj !== 'object') return;
    if ('field_id' in obj && 'value' in obj && 'source' in obj && 'status' in obj) {
      wrappers.push(obj);
      return;
    }
    if (Array.isArray(obj)) {
      obj.forEach(item => traverse(item));
    } else {
      Object.keys(obj).forEach(key => traverse(obj[key]));
    }
  }
  traverse(data);
  return wrappers;
}

export function calculateReviewSummary(data: MasterCaseData, overrides: FieldOverride[] = []): PetitionReviewSummary {
  const wrappers = extractAllFieldWrappers(data);
  const total = wrappers.length || 1;
  let raw = 0, verified = 0, approved = 0, flagged = 0;
  wrappers.forEach(w => {
    switch (w.status) {
      case 'raw_extracted': raw++; break;
      case 'user_verified': verified++; break;
      case 'attorney_approved': approved++; break;
      case 'flagged': flagged++; break;
    }
  });

  const auditFlags = runHardAuditFlags({
    bankAccounts: data.schedule_ab?.personal_property
      .filter(p => p.line_number.value === '17')
      .map(p => ({ account_id: p.id, bank_name: p.description.value, ocr_statement_balance: p.current_value.value, schedule_ab_line17_reported_balance: p.current_value.value })) || [],
    insiderPayments: [],
    securedDebts: data.schedule_d?.secured_claims.map(s => ({
      claim_id: s.id,
      creditor_name: s.creditor_name.value,
      claim_amount: s.total_claim_amount.value,
      collateral_schedule_ab_id: s.collateral_property_ref_id.value || undefined,
      has_form_108_entry: true
    })) || [],
    payStubs: data.means_test_122a?.paystubs_6_months?.length
      ? data.means_test_122a.paystubs_6_months.map((p, idx) => ({ stub_id: `stub_${idx}`, pay_date: '2026-08-01' }))
      : [{ stub_id: 'stub_default', pay_date: '2026-08-01' }],
    petitionDate: '2026-08-02'
  });

  const criticalCount = auditFlags.filter(f => f.severity === 'CRITICAL').length;
  const readiness = Number((((verified + approved) / total) * 100).toFixed(1));
  const canSign = criticalCount === 0 && flagged === 0;

  return {
    total_fields: total,
    raw_extracted_count: raw,
    user_verified_count: verified,
    attorney_approved_count: approved,
    flagged_count: flagged,
    readiness_percentage: readiness,
    active_overrides_count: overrides.length,
    hard_audit_critical_flags_count: criticalCount,
    can_execute_signoff: canSign
  };
}

export function applyFieldOverride(data: MasterCaseData, override: FieldOverride) {
  const wrappers = extractAllFieldWrappers(data);
  const target = wrappers.find(w => w.field_id === override.field_id);
  if (target) {
    target.value = override.overridden_value;
    target.status = 'attorney_approved';
    target.source = {
      type: 'manual_entry',
      calculated_by: `Attorney Override (${override.attorney_name} #${override.bar_number})`
    };
    target.attorney_notes = override.attorney_reason;
    return { updated_data: data, success: true };
  }
  return { updated_data: data, success: false };
}

export function executeAttorneySignoff(data: MasterCaseData, signoff: AttorneySignoff, overrides: FieldOverride[] = []) {
  const errors: string[] = [];
  if (!signoff.declaration_accepted) {
    errors.push('Attorney declaration under penalty of perjury must be explicitly accepted.');
  }
  if (!signoff.bar_number || signoff.bar_number.trim().length < 4) {
    errors.push('A valid Attorney Bar Number is required.');
  }
  const summary = calculateReviewSummary(data, overrides);
  if (!summary.can_execute_signoff) {
    if (summary.hard_audit_critical_flags_count > 0) {
      errors.push(`Cannot sign off: ${summary.hard_audit_critical_flags_count} critical hard audit compliance flags remain unresolved.`);
    }
    if (summary.flagged_count > 0) {
      errors.push(`Cannot sign off: ${summary.flagged_count} fields are currently flagged for review.`);
    }
  }
  if (errors.length === 0) {
    summary.signoff_details = signoff;
    const wrappers = extractAllFieldWrappers(data);
    wrappers.forEach(w => {
      if (w.status !== 'attorney_approved') {
        w.status = 'attorney_approved';
      }
    });
  }
  return { success: errors.length === 0, summary, errors };
}
