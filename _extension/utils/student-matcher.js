/**
 * Student Matching Algorithm
 * Matches meeting participants to student roster using fuzzy matching
 */

import { normalizeName } from './string-utils.js';

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} Distance (0 = identical)
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  // Increment along the first column of each row
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  // Increment each column in the first row
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} Similarity score (1 = identical, 0 = completely different)
 */
function stringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Match a participant to a student roster
 * @param {Object} participant - { name }
 * @param {Array} roster - Array of { id, name }
 * @param {number} threshold - Minimum confidence score (0-1)
 * @returns {Object|null} - { student, score } or null if no match
 */
export function matchParticipant(participant, roster, threshold = 0.7) {
  if (!participant || !roster || roster.length === 0) {
    console.log('[StudentMatcher] ❌ Invalid input - participant:', !!participant, 'roster size:', roster?.length || 0);
    return null;
  }

  console.log('[StudentMatcher] 🔍 Matching participant:', participant.name, 'against', roster.length, 'students');
  const normalizedParticipantName = normalizeName(participant.name);
  console.log('[StudentMatcher] Normalized participant name:', `"${participant.name}" -> "${normalizedParticipantName}"`);

  const matches = [];
  let bestScore = 0;
  let bestStudent = null;

  for (const student of roster) {
    let score = 0;

    // Strategy 1: Exact name match (high confidence)
    const normalizedStudentName = normalizeName(student.name);
    
    if (normalizedParticipantName && normalizedStudentName) {
      if (normalizedParticipantName === normalizedStudentName) {
        console.log('[StudentMatcher] ✅ EXACT MATCH:', `"${normalizedParticipantName}" === "${normalizedStudentName}"`, '(', student.name, ')');
        return { student, score: 1.0, method: 'exact_name' };
      }
    }

    // Strategy 2: Fuzzy name match
    
    if (normalizedParticipantName && normalizedStudentName) {
      const nameSimilarity = stringSimilarity(
        normalizedParticipantName,
        normalizedStudentName
      );
      score += nameSimilarity * 0.8; // Name match weighted 80%
      
      if (nameSimilarity > bestScore) {
        bestScore = nameSimilarity;
        bestStudent = student.name;
      }
    }

    // Strategy 3: Partial name match (first or last name)
    const participantParts = normalizedParticipantName.split(' ');
    const studentParts = normalizedStudentName.split(' ');
    
    for (const pPart of participantParts) {
      for (const sPart of studentParts) {
        if (pPart.length > 2 && sPart.length > 2) {
          const partSimilarity = stringSimilarity(pPart, sPart);
          if (partSimilarity > 0.85) {
            score += 0.1; // Bonus for matching first/last name
            break;
          }
        }
      }
    }

    // Ensure score doesn't exceed 1.0
    score = Math.min(score, 1.0);

    if (score >= threshold) {
      matches.push({ 
        student, 
        score,
        method: score >= 0.9 ? 'high_confidence' : 'fuzzy_match'
      });
    }
  }

  // Return best match
  if (matches.length === 0) {
    console.log('[StudentMatcher] ❌ NO MATCH found for:', participant.name);
    console.log('[StudentMatcher] Best similarity was:', (bestScore * 100).toFixed(1) + '% with', bestStudent, '(threshold:', (threshold * 100) + '%)');
    console.log('[StudentMatcher] Sample roster names:', roster.slice(0, 5).map(s => `"${s.name}" -> "${normalizeName(s.name)}"`));
    return null;
  }

  matches.sort((a, b) => b.score - a.score);
  console.log('[StudentMatcher] ✅ Best match:', matches[0].student.name, 'with score:', (matches[0].score * 100).toFixed(1) + '%');
  return matches[0];
}

/**
 * Batch match multiple participants
 * @param {Array} participants - Array of { name, email }
 * @param {Array} roster - Array of { id, name, email }
 * @param {number} threshold - Minimum confidence score
 * @returns {Array} - Array of { participant, match: { student, score } | null }
 */
export function batchMatchParticipants(participants, roster, threshold = 0.7) {
  return participants.map(participant => ({
    participant,
    match: matchParticipant(participant, roster, threshold)
  }));
}

/**
 * Get match confidence label
 * @param {number} score 
 * @returns {string} - 'high' | 'medium' | 'low'
 */
export function getConfidenceLabel(score) {
  if (score >= 0.9) return 'high';
  if (score >= 0.7) return 'medium';
  return 'low';
}
