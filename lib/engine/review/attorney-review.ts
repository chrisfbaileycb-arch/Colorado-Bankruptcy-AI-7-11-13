import type { FieldWrapper, MasterCaseData } from '../../types/master-case';
import { runHardAuditFlags } from '../validators/hard-audit';
import type { AttorneySignoff, FieldOverride, PetitionReviewSummary, ReviewPartitionApproval, SelfReviewConfirmation } from './types';

function isFieldWrapper(value: unknown): value is FieldWrapper<unknown> {
  return Boolean(value && typeof value === 'object' && 'field_id' in value && 'status' in value && 'value' in value);
}

export function extractAllFieldWrappers(data: MasterCaseData): FieldWrapper<unknown>[] {
  const found: FieldWrapper<unknown>[] = [];
  const seen = new Set<object>();
  const walk = (value: unknown) => {
    if (!value || typeof value !== 'object' || seen.has(value as object)) return;
    seen.add(value as object);
    if (isFieldWrapper(value)) { found.push(value); return; }
    for (const child of Object.values(value as Record<string, unknown>)) walk(child);
  };
  walk(data);
  return found;
}

export function calculateReviewSummary(data: MasterCaseData, signoff?: AttorneySignoff): PetitionReviewSummary {
  const fields = extractAllFieldWrappers(data);
  const critical = runHardAuditFlags(data).filter(flag => flag.severity === 'CRITICAL').length;
  const approved = fields.filter(field => field.status === 'attorney_approved').length;
  const verified = fields.filter(field => field.status === 'user_verified').length;
  const flagged = fields.filter(field => field.status === 'discrepancy_flagged').length;
  const ready = fields.length === 0 ? 0 : ((approved + verified) / fields.length) * 100;
  return {
    total_fields: fields.length,
    raw_extracted_count: fields.filter(field => field.status === 'raw_extracted').length,
    user_verified_count: verified,
    attorney_approved_count: approved,
    flagged_count: flagged,
    readiness_percentage: ready,
    active_overrides_count: fields.filter(field => Boolean(field.attorney_notes)).length,
    hard_audit_critical_flags_count: critical,
    can_execute_signoff: fields.length > 0 && critical === 0 && flagged === 0 && approved === fields.length,
    signoff_details: signoff
  };
}

export function applyFieldOverride(data: MasterCaseData, override: FieldOverride) {
  const field = extractAllFieldWrappers(data).find(item => item.field_id === override.field_id);
  if (!field) return { success: false, errors: ['Field not found.'], updated_data: data };
  field.value = override.overridden_value;
  field.status = 'attorney_approved';
  field.attorney_notes = override.attorney_reason;
  field.source = { type: 'attorney_override' };
  return { success: true, errors: [], updated_data: data };
}

function validatePartitionApprovals(signoff: AttorneySignoff): string[] {
  if (signoff.review_mode !== 'PARTITIONED') return [];
  const approvals = [...(signoff.partition_approvals ?? [])].sort((a, b) => a.step_start - b.step_start);
  if (approvals.length === 0) return ['Partitioned review requires at least one recorded attorney approval.'];
  const covered = new Set<number>();
  const errors: string[] = [];
  for (const approval of approvals) {
    if (approval.step_start < 1 || approval.step_end > 16 || approval.step_start > approval.step_end) {
      errors.push('Review partitions must stay within intake Steps 1 through 16.');
      continue;
    }
    if (approval.attorney_name.trim() !== signoff.attorney_name.trim() || approval.bar_number.trim() !== signoff.bar_number.trim()) {
      errors.push('Every review partition must be approved by the signing attorney.');
    }
    if (!approval.note.trim()) errors.push('Every review partition requires an audit note.');
    for (let step = approval.step_start; step <= approval.step_end; step += 1) covered.add(step);
  }
  const missing = Array.from({ length: 16 }, (_, index) => index + 1).filter(step => !covered.has(step));
  if (missing.length > 0) errors.push(`Partitioned review does not cover intake step(s): ${missing.join(', ')}.`);
  return errors;
}

export function executeSelfReviewCompletion(data: MasterCaseData, confirmation: SelfReviewConfirmation) {
  const errors: string[] = [];
  if (!confirmation.reviewer_name.trim()) errors.push('Self-reviewer name is required.');
  if (!confirmation.declaration_accepted) errors.push('The self-review confirmation must be accepted.');
  if (confirmation.step_start !== 1 || confirmation.step_end !== 16) errors.push('Self-review must cover intake Steps 1 through 16.');
  const summary = calculateReviewSummary(data);
  if (summary.hard_audit_critical_flags_count > 0) errors.push('Critical audit flags must be resolved.');
  if (summary.flagged_count > 0) errors.push('Flagged fields must be resolved.');
  return {
    success: errors.length === 0,
    errors,
    summary,
    confirmation,
    review_label: 'SELF_REPRESENTED_REVIEW' as const
  };
}

export function executeAttorneySignoff(data: MasterCaseData, signoff: AttorneySignoff) {
  const errors: string[] = [];
  if (!signoff.attorney_name.trim()) errors.push('Supervising Attorney Name is required.');
  if (signoff.bar_number.trim().length < 4) errors.push('A valid Attorney Bar Number is required.');
  if (!signoff.firm_name.trim()) errors.push('Law Firm Name is required.');
  if (!signoff.declaration_accepted) errors.push('The review confirmation must be accepted.');
  const summary = calculateReviewSummary(data, signoff);
  if (summary.hard_audit_critical_flags_count > 0) errors.push('Critical audit flags must be resolved.');
  if (summary.flagged_count > 0) errors.push('Flagged fields must be resolved.');
  if (signoff.review_mode === 'PARTITIONED') {
    errors.push(...validatePartitionApprovals(signoff));
  } else if (summary.attorney_approved_count !== summary.total_fields) {
    errors.push('Every material field must be attorney-approved before signoff, unless a complete partitioned review policy is recorded.');
  }
  return { success: errors.length === 0, errors, summary: calculateReviewSummary(data, signoff) };
}
