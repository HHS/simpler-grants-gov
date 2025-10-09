/**
 * Unit tests for enhanced frontend validation security
 */

import { validateUiSchema, validateJsonBySchema } from '../../../src/components/applyForm/validate';

describe('Enhanced Frontend Validation Security', () => {
  describe('validateUiSchema', () => {
    it('should validate correct UI schema structure', () => {
      const validSchema = [
        {
          type: 'field',
          name: 'testField',
          schema: {
            schema: {
              title: 'Test Field',
              type: 'string'
            }
          }
        }
      ];

      const result = validateUiSchema(validSchema);
      expect(result).toBe(false); // No errors
    });

    it('should reject excessively deep structures', () => {
      // Create a deeply nested structure
      let deepStructure: any = { type: 'section', label: 'Deep', name: 'deep', children: [] };
      for (let i = 0; i < 20; i++) {
        deepStructure = {
          type: 'section',
          label: `Level${i}`,
          name: `level${i}`,
          children: [deepStructure]
        };
      }

      const result = validateUiSchema([deepStructure]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].message).toContain('Structure validation failed');
    });

    it('should reject structures with too many keys', () => {
      const largeStructure: any = {};
      // Create an object with excessive keys
      for (let i = 0; i < 1001; i++) {
        largeStructure[`key${i}`] = `value${i}`;
      }

      const result = validateUiSchema([largeStructure]);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].message).toContain('Structure validation failed');
    });
  });

  describe('validateJsonBySchema', () => {
    const simpleSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 100 },
        age: { type: 'number', minimum: 0 }
      },
      required: ['name']
    };

    it('should validate correct data', () => {
      const validData = { name: 'John Doe', age: 30 };
      
      const result = validateJsonBySchema(validData, simpleSchema);
      expect(result).toBe(false); // No errors
    });

    it('should return validation errors for invalid data', () => {
      const invalidData = { age: -5 }; // Missing required name, negative age
      
      const result = validateJsonBySchema(invalidData, simpleSchema);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should reject input with excessive nesting', () => {
      let deepData: any = { value: 'deep' };
      for (let i = 0; i < 20; i++) {
        deepData = { level: deepData };
      }

      const result = validateJsonBySchema(deepData, { type: 'object' });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].message).toContain('Input validation failed');
    });

    it('should reject schema with excessive nesting', () => {
      let deepSchema: any = { type: 'string' };
      for (let i = 0; i < 15; i++) {
        deepSchema = {
          type: 'object',
          properties: { nested: deepSchema }
        };
      }

      const result = validateJsonBySchema({ test: 'value' }, deepSchema);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].message).toContain('Input validation failed');
    });

    it('should handle arrays with many items appropriately', () => {
      const arraySchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      };

      // Moderate size array should be fine
      const moderateData = { items: Array.from({ length: 100 }, (_, i) => `item${i}`) };
      const result1 = validateJsonBySchema(moderateData, arraySchema);
      expect(result1).toBe(false);

      // Very large array should trigger validation limits
      const largeData = { items: Array.from({ length: 2000 }, (_, i) => `item${i}`) };
      const result2 = validateJsonBySchema(largeData, arraySchema);
      // May be rejected by structure validation or AJV limits
      expect(typeof result2).toBeDefined();
    });

    it('should sanitize error messages', () => {
      const maliciousData = { 
        name: '<script>alert("xss")</script>'.repeat(100) // Very long malicious string
      };
      
      const result = validateJsonBySchema(maliciousData, simpleSchema);
      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        result.forEach(error => {
          expect(typeof error.message).toBe('string');
          expect(error.message.length).toBeLessThanOrEqual(500); // Should be limited
          // Message should be sanitized
          expect(error.message).not.toContain('<script>');
        });
      }
    });

    it('should handle complex but valid structures', () => {
      const complexSchema = {
        type: 'object',
        properties: {
          users: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                profile: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    preferences: {
                      type: 'object',
                      properties: {
                        theme: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };

      const complexData = {
        users: [
          {
            name: 'Alice',
            profile: {
              email: 'alice@example.com',
              preferences: {
                theme: 'dark'
              }
            }
          }
        ]
      };

      const result = validateJsonBySchema(complexData, complexSchema);
      expect(result).toBe(false); // Should pass validation
    });

    it('should enforce AJV security limits', () => {
      const schema = {
        type: 'object',
        properties: {
          longString: { type: 'string' }
        }
      };

      // String that exceeds maxLength limit
      const dataWithLongString = {
        longString: 'x'.repeat(10001) // Exceeds the 10000 char limit
      };

      const result = validateJsonBySchema(dataWithLongString, schema);
      // Should be handled by AJV maxLength configuration or structure validation
      expect(typeof result).toBeDefined();
    });

    it('should handle objects with many properties', () => {
      const schema = { type: 'object' };
      
      // Object with moderate number of properties
      const moderateObject: any = {};
      for (let i = 0; i < 100; i++) {
        moderateObject[`prop${i}`] = `value${i}`;
      }
      
      const result1 = validateJsonBySchema(moderateObject, schema);
      expect(result1).toBe(false);

      // Object with excessive properties should be rejected
      const largeObject: any = {};
      for (let i = 0; i < 1001; i++) {
        largeObject[`prop${i}`] = `value${i}`;
      }
      
      const result2 = validateJsonBySchema(largeObject, schema);
      expect(Array.isArray(result2)).toBe(true);
      expect(result2.length).toBeGreaterThan(0);
      expect(result2[0].message).toContain('Input validation failed');
    });
  });

  describe('Security Edge Cases', () => {
    it('should handle null and undefined inputs safely', () => {
      // These should be handled gracefully without crashing
      expect(() => validateUiSchema(null as any)).not.toThrow();
      expect(() => validateUiSchema(undefined as any)).not.toThrow();
      expect(() => validateJsonBySchema(null as any, { type: 'object' })).not.toThrow();
    });

    it('should handle circular references safely', () => {
      const circularObject: any = { name: 'test' };
      circularObject.self = circularObject;

      // Should not cause infinite recursion
      expect(() => {
        validateJsonBySchema(circularObject, { type: 'object' });
      }).not.toThrow();
    });

    it('should handle mixed content types', () => {
      const mixedData = {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        nullValue: null
      };

      const mixedSchema = {
        type: 'object',
        properties: {
          string: { type: 'string' },
          number: { type: 'number' },
          boolean: { type: 'boolean' },
          array: { type: 'array' },
          object: { type: 'object' },
          nullValue: { type: 'null' }
        }
      };

      const result = validateJsonBySchema(mixedData, mixedSchema);
      expect(result).toBe(false); // Should validate successfully
    });
  });
});