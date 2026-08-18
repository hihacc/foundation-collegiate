/**
 * Mathematical Field-Level Consensus & Confidence Engine
 * Zero-Trust verification comparing independent OCR outputs from Hugging Face, OpenRouter, and Neural Preprocessors.
 */

export interface FieldComparison<T> {
  hf_value: T | null;
  openrouter_value: T | null;
  consensus_value: T | null;
  is_match: boolean;
  similarity_score: number; // 0 to 100
  status: 'verified' | 'needs_review' | 'discrepancy' | 'single_source';
}

export interface DualAiRecordConsensus {
  gr_number: FieldComparison<number>;
  student_name: FieldComparison<string>;
  class_name: FieldComparison<string>;
  composite_confidence: number; // 0 to 100
  verification_status: 'verified' | 'needs_review' | 'uncertain' | 'blank_slot';
  consensus_notes: string;
  source_evidence?: {
    hf_raw?: string;
    openrouter_raw?: string;
    local_raw?: string;
  };
}

/**
 * Standard Levenshtein Distance for character-level difference
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1 === s2) return 0;
  if (!s1.length) return s2.length;
  if (!s2.length) return s1.length;

  const row: number[] = [];
  for (let i = 0; i <= s2.length; i++) {
    row[i] = i;
  }

  for (let i = 1; i <= s1.length; i++) {
    let prev = i;
    for (let j = 1; j <= s2.length; j++) {
      let val: number;
      if (s1[i - 1] === s2[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[s2.length] = prev;
  }

  return row[s2.length];
}

/**
 * Normalized string similarity score (0% to 100%)
 */
export function calculateStringSimilarity(a: string, b: string): number {
  if (!a && !b) return 100;
  if (!a || !b) return 0;

  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();
  if (s1 === s2) return 100;

  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;

  const distance = calculateLevenshteinDistance(s1, s2);
  const sim = (1 - distance / maxLen) * 100;
  return Math.max(0, Math.min(100, Math.round(sim)));
}

/**
 * Normalizes academic class names for comparison
 */
export function normalizeClassNameForComparison(cls: string): string {
  if (!cls) return '';
  return cls
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/class/g, '')
    .replace(/premedical/g, 'med')
    .replace(/preengineering/g, 'eng')
    .replace(/computerscience/g, 'cs')
    .replace(/commerce/g, 'comm');
}

/**
 * Compares two G.R. Candidate extractions from separate AI providers
 */
export function evaluateDualAiRecordConsensus(
  hf: { gr_number?: number; student_name?: string; class_name?: string; raw_line?: string } | null,
  or: { gr_number?: number; student_name?: string; class_name?: string; raw_line?: string } | null
): DualAiRecordConsensus {
  // Case 1: Both providers supplied data
  if (hf && or) {
    // 1. GR Number Field
    const hfGr = hf.gr_number || null;
    const orGr = or.gr_number || null;
    const grMatch = hfGr !== null && orGr !== null && hfGr === orGr;
    const grScore = grMatch ? 100 : (hfGr && orGr ? 0 : 50);

    const grField: FieldComparison<number> = {
      hf_value: hfGr,
      openrouter_value: orGr,
      consensus_value: hfGr || orGr,
      is_match: grMatch,
      similarity_score: grScore,
      status: grMatch ? 'verified' : 'discrepancy'
    };

    // 2. Student Name Field
    const hfName = hf.student_name?.trim() || null;
    const orName = or.student_name?.trim() || null;
    const nameSim = calculateStringSimilarity(hfName || '', orName || '');
    const nameMatch = nameSim >= 85;

    let consensusName = hfName || orName;
    // Prefer the more complete name if both provided
    if (hfName && orName && orName.length > hfName.length && nameSim >= 70) {
      consensusName = orName;
    }

    const nameField: FieldComparison<string> = {
      hf_value: hfName,
      openrouter_value: orName,
      consensus_value: consensusName,
      is_match: nameMatch,
      similarity_score: nameSim,
      status: !hfName && !orName ? 'verified' : nameMatch ? 'verified' : (nameSim >= 50 ? 'needs_review' : 'discrepancy')
    };

    // 3. Class Name Field
    const hfCls = hf.class_name?.trim() || null;
    const orCls = or.class_name?.trim() || null;
    const clsNormHf = normalizeClassNameForComparison(hfCls || '');
    const clsNormOr = normalizeClassNameForComparison(orCls || '');
    const clsSim = calculateStringSimilarity(clsNormHf, clsNormOr);
    const clsMatch = clsSim >= 80;

    const classField: FieldComparison<string> = {
      hf_value: hfCls,
      openrouter_value: orCls,
      consensus_value: hfCls || orCls,
      is_match: clsMatch,
      similarity_score: clsSim,
      status: !hfCls && !orCls ? 'verified' : clsMatch ? 'verified' : 'needs_review'
    };

    // 4. Weighted Composite Confidence
    // Weights: GR Number (40%), Name (40%), Class (20%)
    const compositeScore = Math.round(
      (grScore * 0.4) + (nameSim * 0.4) + (clsSim * 0.2)
    );

    let status: 'verified' | 'needs_review' | 'uncertain' | 'blank_slot' = 'needs_review';
    let notes = '';

    if (!consensusName) {
      status = 'blank_slot';
      notes = 'Blank register slot (unassigned line in ledger)';
    } else if (grMatch && nameMatch && clsMatch) {
      status = 'verified';
      notes = `Dual AI Consensus Match (${compositeScore}% Agreement)`;
    } else if (grMatch && (nameSim >= 65 || clsMatch)) {
      status = 'needs_review';
      notes = `Minor field discrepancy (Name similarity: ${nameSim}%) — Admin verification recommended`;
    } else {
      status = 'uncertain';
      notes = `Engine disagreement between Hugging Face & OpenRouter — Full review required`;
    }

    return {
      gr_number: grField,
      student_name: nameField,
      class_name: classField,
      composite_confidence: compositeScore,
      verification_status: status,
      consensus_notes: notes,
      source_evidence: {
        hf_raw: hf.raw_line,
        openrouter_raw: or.raw_line
      }
    };
  }

  // Case 2: Single provider output only
  const single = hf || or;
  const isHf = !!hf;
  const gr = single?.gr_number || null;
  const name = single?.student_name?.trim() || null;
  const cls = single?.class_name?.trim() || null;

  return {
    gr_number: {
      hf_value: isHf ? gr : null,
      openrouter_value: !isHf ? gr : null,
      consensus_value: gr,
      is_match: false,
      similarity_score: 75,
      status: 'single_source'
    },
    student_name: {
      hf_value: isHf ? name : null,
      openrouter_value: !isHf ? name : null,
      consensus_value: name,
      is_match: false,
      similarity_score: 75,
      status: 'single_source'
    },
    class_name: {
      hf_value: isHf ? cls : null,
      openrouter_value: !isHf ? cls : null,
      consensus_value: cls,
      is_match: false,
      similarity_score: 75,
      status: 'single_source'
    },
    composite_confidence: name ? 75 : 90,
    verification_status: !name ? 'blank_slot' : 'needs_review',
    consensus_notes: `Single AI engine capture (${isHf ? 'Hugging Face' : 'OpenRouter'}) — Awaiting second pass or admin verification`,
    source_evidence: {
      [isHf ? 'hf_raw' : 'openrouter_raw']: single?.raw_line
    }
  };
}
