import { matchParticipant } from '../../utils/student-matcher.js';

describe('Student Matcher', () => {
  const roster = [
    { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob.j@example.com' },
  ];

  describe('matchParticipant', () => {
    it('should find exact name match', () => {
      const result = matchParticipant({ name: 'John Doe' }, roster, 0.7);
      expect(result).not.toBeNull();
      expect(result.student.id).toBe(1);
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('should find email match', () => {
      const result = matchParticipant({ email: 'jane.smith@example.com' }, roster, 0.7);
      expect(result).not.toBeNull();
      expect(result.student.id).toBe(2);
      expect(result.score).toBeGreaterThan(0.7);
    });

    it('should find partial match with lower threshold', () => {
      const result = matchParticipant({ name: 'Jane Smith' }, roster, 0.5);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.student.id).toBe(2);
      }
    });

    it('should return null for no match above threshold', () => {
      const result = matchParticipant({ name: 'Unknown Person' }, roster, 0.9);
      expect(result).toBeNull();
    });

    it('should handle empty roster', () => {
      const result = matchParticipant({ name: 'John Doe' }, [], 0.7);
      expect(result).toBeNull();
    });
  });
});
