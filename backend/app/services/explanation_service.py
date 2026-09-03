"""Explanation Service — Phase 4.

This module will generate human-readable explanations for compliance results,
highlighting specific label regions that triggered each finding.

Will produce:
  - Per-finding natural language explanation
  - References to relevant rule sections
  - Visual bounding box coordinates for annotating the original image
"""
from __future__ import annotations


class ExplanationService:
    """Stub — to be implemented in Phase 4."""

    def explain(self, compliance_result: dict) -> dict:
        """Generate explanations for compliance findings.

        Raises:
            NotImplementedError: Until Phase 4 is implemented.
        """
        raise NotImplementedError("ExplanationService is not implemented in Phase 4.")
