/**
 * Feedback collector — manages feedback flow and storage.
 */
import * as storage from '../utils/storage.js';

const EXTRACTION_THRESHOLD = 3; // Show feedback after N extractions
const RATING_DAYS_THRESHOLD = 7; // Show rating prompt after N days
const RATING_COOLDOWN_DAYS = 14; // Days between re-prompts
const MAX_REVIEW_PROMPTS = 3; // Max review prompts per year
const NPS_INTERVAL_DAYS = 90; // NPS survey every N days

/**
 * Check if we should show the feedback widget.
 */
export async function shouldShowFeedback() {
  const data = await storage.get(['extractionCount', 'feedbackGiven', 'feedbackDismissed']);

  if (data.feedbackGiven || data.feedbackDismissed) return false;
  return data.extractionCount >= EXTRACTION_THRESHOLD;
}

/**
 * Check if we should show the rating prompt.
 */
export async function shouldShowRating() {
  const data = await storage.get([
    'extractionCount',
    'firstUseDate',
    'ratingGiven',
    'ratingDismissed',
    'ratingNeverAsk',
    'ratingPromptCount',
    'ratingLastPrompt',
    'feedbackGiven',
  ]);

  // Don't show if already rated or permanently dismissed
  if (data.ratingGiven || data.ratingNeverAsk) return false;

  // Max review prompts reached
  if ((data.ratingPromptCount || 0) >= MAX_REVIEW_PROMPTS) return false;

  // Cooldown period
  if (data.ratingLastPrompt) {
    const daysSince = (Date.now() - data.ratingLastPrompt) / (1000 * 60 * 60 * 24);
    if (daysSince < RATING_COOLDOWN_DAYS) return false;
  }

  // Only show if user has given positive feedback
  if (!data.feedbackGiven) return false;

  // Only show after enough time
  if (!data.firstUseDate) return false;
  const daysSinceFirst = (Date.now() - data.firstUseDate) / (1000 * 60 * 60 * 24);
  return daysSinceFirst >= RATING_DAYS_THRESHOLD;
}

/**
 * Check if NPS survey is due.
 */
export async function shouldShowNPS() {
  const data = await storage.get(['lastNpsDate', 'extractionCount']);

  // Need at least some usage
  if (data.extractionCount < 10) return false;

  if (!data.lastNpsDate) return true;

  const daysSinceNps = (Date.now() - data.lastNpsDate) / (1000 * 60 * 60 * 24);
  return daysSinceNps >= NPS_INTERVAL_DAYS;
}

/**
 * Record feedback submission.
 */
export async function saveFeedback(rating, comment = '') {
  const feedback = {
    rating,
    comment,
    timestamp: Date.now(),
    extractionCount: (await storage.get('extractionCount')).extractionCount,
  };

  // Store locally
  const { feedbackHistory = [] } = await storage.get('feedbackHistory');
  feedbackHistory.push(feedback);
  await storage.set({
    feedbackHistory,
    feedbackGiven: true,
    lastFeedbackRating: rating,
  });

  return feedback;
}

/**
 * Record rating prompt response.
 */
export async function saveRatingResponse(accepted) {
  const data = await storage.get(['ratingPromptCount']);
  const updates = {
    ratingGiven: accepted,
    ratingLastPrompt: Date.now(),
    ratingPromptCount: (data.ratingPromptCount || 0) + 1,
  };
  if (!accepted) {
    // "Maybe later" → re-ask after cooldown. "Never" would set ratingNeverAsk.
    updates.ratingDismissed = true;
  }
  await storage.set(updates);
}

/**
 * Record NPS response.
 */
export async function saveNPS(score) {
  await storage.set({
    lastNpsDate: Date.now(),
    lastNpsScore: score,
  });
}
