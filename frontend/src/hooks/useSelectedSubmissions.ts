import SessionStorage from "src/services/sessionStorage/sessionStorage";
import { AwardRecommendationSubmission } from "src/types/awardRecommendationTypes";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "selected-submissions-";

export interface UseSelectedSubmissionsReturn {
  selectedSubmissionIds: Set<string>;
  selectedSubmissions: AwardRecommendationSubmission[];
  setSelectedSubmissionIds: (ids: Set<string>) => void;
  addSubmission: (submission: AwardRecommendationSubmission) => void;
  removeSubmission: (id: string) => void;
  addMultipleSubmissions: (
    submissions: AwardRecommendationSubmission[],
  ) => void;
  clearSelections: () => void;
  hasSelections: boolean;
}

interface StoredSelections {
  ids: string[];
  submissions: AwardRecommendationSubmission[];
}

function getInitialState(storageKey: string): {
  ids: Set<string>;
  submissions: AwardRecommendationSubmission[];
} {
  const stored = SessionStorage.getItem(storageKey);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as StoredSelections;
      return {
        ids: new Set(parsed.ids || []),
        submissions: parsed.submissions || [],
      };
    } catch (e) {
      console.error("Error parsing stored selections:", e);
    }
  }
  return { ids: new Set(), submissions: [] };
}

export function useSelectedSubmissions(
  awardRecommendationId: string,
): UseSelectedSubmissionsReturn {
  const storageKey = `${STORAGE_KEY_PREFIX}${awardRecommendationId}`;

  const [selectedSubmissionIds, setSelectedSubmissionIdsState] = useState<
    Set<string>
  >(() => getInitialState(storageKey).ids);
  const [selectedSubmissions, setSelectedSubmissions] = useState<
    AwardRecommendationSubmission[]
  >(() => getInitialState(storageKey).submissions);

  const persistToStorage = useCallback(
    (ids: Set<string>, submissions: AwardRecommendationSubmission[]) => {
      SessionStorage.setItem(
        storageKey,
        JSON.stringify({
          ids: Array.from(ids),
          submissions,
        }),
      );
    },
    [storageKey],
  );

  const setSelectedSubmissionIds = useCallback(
    (ids: Set<string>) => {
      setSelectedSubmissionIdsState(ids);
      const updatedSubmissions = selectedSubmissions.filter((s) =>
        ids.has(s.award_recommendation_application_submission_id),
      );
      setSelectedSubmissions(updatedSubmissions);
      persistToStorage(ids, updatedSubmissions);
    },
    [selectedSubmissions, persistToStorage],
  );

  const addSubmission = useCallback(
    (submission: AwardRecommendationSubmission) => {
      const id = submission.award_recommendation_application_submission_id;
      const newIds = new Set(selectedSubmissionIds);
      newIds.add(id);

      const exists = selectedSubmissions.some(
        (s) => s.award_recommendation_application_submission_id === id,
      );
      const newSubmissions = exists
        ? selectedSubmissions
        : [...selectedSubmissions, submission];

      setSelectedSubmissionIdsState(newIds);
      setSelectedSubmissions(newSubmissions);
      persistToStorage(newIds, newSubmissions);
    },
    [selectedSubmissionIds, selectedSubmissions, persistToStorage],
  );

  const removeSubmission = useCallback(
    (id: string) => {
      const newIds = new Set(selectedSubmissionIds);
      newIds.delete(id);

      const newSubmissions = selectedSubmissions.filter(
        (s) => s.award_recommendation_application_submission_id !== id,
      );

      setSelectedSubmissionIdsState(newIds);
      setSelectedSubmissions(newSubmissions);
      persistToStorage(newIds, newSubmissions);
    },
    [selectedSubmissionIds, selectedSubmissions, persistToStorage],
  );

  const addMultipleSubmissions = useCallback(
    (submissionsToAdd: AwardRecommendationSubmission[]) => {
      const newIds = new Set(selectedSubmissionIds);
      const existingIds = new Set(
        selectedSubmissions.map(
          (s) => s.award_recommendation_application_submission_id,
        ),
      );

      const newSubmissionsToAdd = submissionsToAdd.filter((submission) => {
        const id = submission.award_recommendation_application_submission_id;
        newIds.add(id);
        return !existingIds.has(id);
      });

      const updatedSubmissions = [
        ...selectedSubmissions,
        ...newSubmissionsToAdd,
      ];

      setSelectedSubmissionIdsState(newIds);
      setSelectedSubmissions(updatedSubmissions);
      persistToStorage(newIds, updatedSubmissions);
    },
    [selectedSubmissionIds, selectedSubmissions, persistToStorage],
  );

  const clearSelections = useCallback(() => {
    setSelectedSubmissionIdsState(new Set());
    setSelectedSubmissions([]);
    SessionStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    selectedSubmissionIds,
    selectedSubmissions,
    setSelectedSubmissionIds,
    addSubmission,
    addMultipleSubmissions,
    removeSubmission,
    clearSelections,
    hasSelections: selectedSubmissionIds.size > 0,
  };
}
