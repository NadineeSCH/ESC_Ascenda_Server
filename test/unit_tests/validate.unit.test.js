// tests/services/validate.test.js
const validate = require('../../services/validate');

describe('Validate Service', () => {
  describe('validator', () => {
    const validData = {
      name: 'John Doe',
      phone: '91234567',
      password: 'StrongPass123'
    };

    describe('Valid inputs', () => {
      it('should pass validation with all valid inputs', async () => {
        await expect(validate.validator(validData)).resolves.toBeUndefined();
      });

      it('should pass with minimum valid name length (2 characters)', async () => {
        const data = { ...validData, name: 'Jo' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with maximum valid name length (50 characters)', async () => {
        const data = { ...validData, name: 'A'.repeat(50) };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with name containing spaces', async () => {
        const data = { ...validData, name: 'John Middle Doe' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with name containing hyphens', async () => {
        const data = { ...validData, name: 'Mary-Jane' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with name containing apostrophes', async () => {
        const data = { ...validData, name: "O'Connor" };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with name containing accented characters', async () => {
        const data = { ...validData, name: 'José María' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with phone starting with 6', async () => {
        const data = { ...validData, phone: '61234567' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with phone starting with 8', async () => {
        const data = { ...validData, phone: '81234567' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with phone starting with 9', async () => {
        const data = { ...validData, phone: '91234567' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with minimum valid password (8 chars with all requirements)', async () => {
        const data = { ...validData, password: 'Aa1bcdef' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should pass with long password containing all requirements', async () => {
        const data = { ...validData, password: 'VeryLongPassword123WithAllRequirements' };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should trim whitespace from name and phone', async () => {
        const data = {
          name: '  John Doe  ',
          phone: '  91234567  ',
          password: 'StrongPass123'
        };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });
    });

    describe('Name validation errors', () => {
      it('should throw error for name shorter than 2 characters', async () => {
        const data = { ...validData, name: 'J' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name must be between 2-50 characters');
      });

      it('should throw error for name longer than 50 characters', async () => {
        const data = { ...validData, name: 'A'.repeat(51) };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name must be between 2-50 characters');
      });

      it('should throw error for empty name after trimming', async () => {
        const data = { ...validData, name: '  ' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name must be between 2-50 characters');
      });

      it('should throw error for name with numbers', async () => {
        const data = { ...validData, name: 'John123' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name contains invalid characters');
      });

      it('should throw error for name with special characters', async () => {
        const data = { ...validData, name: 'John@Doe' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name contains invalid characters');
      });

      it('should throw error for name with underscores', async () => {
        const data = { ...validData, name: 'John_Doe' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name contains invalid characters');
      });

      it('should throw error for name with parentheses', async () => {
        const data = { ...validData, name: 'John (Jr)' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name contains invalid characters');
      });

      it('should throw error for name with periods', async () => {
        const data = { ...validData, name: 'John.Doe' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name contains invalid characters');
      });

      it('should throw error for name with exclamation marks', async () => {
        const data = { ...validData, name: 'John!' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name contains invalid characters');
      });
    });

    describe('Phone validation errors', () => {
      it('should throw error for phone not starting with 6, 8, or 9', async () => {
        const data = { ...validData, phone: '51234567' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw error for phone starting with 7', async () => {
        const data = { ...validData, phone: '71234567' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw error for phone with less than 8 digits', async () => {
        const data = { ...validData, phone: '9123456' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw error for phone with more than 8 digits', async () => {
        const data = { ...validData, phone: '912345678' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw error for phone with letters', async () => {
        const data = { ...validData, phone: '9123456a' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw error for phone with special characters', async () => {
        const data = { ...validData, phone: '9123-456' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw error for phone with spaces', async () => {
        const data = { ...validData, phone: '9123 567' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw error for empty phone after trimming', async () => {
        const data = { ...validData, phone: '   ' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw error for phone starting with 0', async () => {
        const data = { ...validData, phone: '01234567' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });
    });

    describe('Password validation errors', () => {
      it('should throw error for password shorter than 8 characters', async () => {
        const data = { ...validData, password: 'Pass1' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Password must be at least 8 characters');
      });

      it('should throw error for 7-character password with all other requirements', async () => {
        const data = { ...validData, password: 'Pass123' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Password must be at least 8 characters');
      });

      it('should throw error for password without uppercase letter', async () => {
        const data = { ...validData, password: 'password123' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Password needs at least 1 uppercase letter');
      });

      it('should throw error for password without lowercase letter', async () => {
        const data = { ...validData, password: 'PASSWORD123' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Password needs at least 1 lowercase letter');
      });

      it('should throw error for password without number', async () => {
        const data = { ...validData, password: 'PasswordOnly' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Password needs at least 1 number');
      });

      it('should throw error for password with only special characters', async () => {
        const data = { ...validData, password: '!@#$%^&*' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Password needs at least 1 uppercase letter');
      });

      it('should throw error for password with spaces only', async () => {
        const data = { ...validData, password: '        ' };
        await expect(validate.validator(data))
          .rejects
          .toThrow('Password needs at least 1 uppercase letter');
      });
    });

    describe('Multiple validation errors', () => {
      it('should throw first encountered error when multiple validations fail', async () => {
        const data = {
          name: 'A', // Too short
          phone: '1234567', // Invalid format
          password: 'pass' // Too short, no uppercase, no number
        };
        
        // Should throw the first error encountered (name validation)
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name must be between 2-50 characters');
      });

      it('should throw phone error when name is valid but phone and password are invalid', async () => {
        const data = {
          name: 'John Doe', // Valid
          phone: '1234567', // Invalid
          password: 'pass' // Invalid
        };
        
        await expect(validate.validator(data))
          .rejects
          .toThrow('Phone must be 8 digits starting with 6, 8 or 9 (Singapore format)');
      });

      it('should throw password length error when name and phone are valid but password is invalid', async () => {
        const data = {
          name: 'John Doe', // Valid
          phone: '91234567', // Valid
          password: 'pass' // Too short
        };
        
        await expect(validate.validator(data))
          .rejects
          .toThrow('Password must be at least 8 characters');
      });
    });

    describe('Edge cases and boundary conditions', () => {
      it('should handle undefined inputs gracefully', async () => {
        await expect(validate.validator({}))
          .rejects
          .toThrow();
      });

      it('should handle null values', async () => {
        const data = {
          name: null,
          phone: null,
          password: null
        };
        
        await expect(validate.validator(data))
          .rejects
          .toThrow();
      });

      it('should handle empty string inputs', async () => {
        const data = {
          name: '',
          phone: '',
          password: ''
        };
        
        await expect(validate.validator(data))
          .rejects
          .toThrow('Name must be between 2-50 characters');
      });

      it('should validate exact boundary values', async () => {
        // Test exact boundary for name (exactly 2 and 50 chars)
        const minNameData = { ...validData, name: 'AB' }; // Exactly 2 chars
        const maxNameData = { ...validData, name: 'A'.repeat(50) }; // Exactly 50 chars
        
        await expect(validate.validator(minNameData)).resolves.toBeUndefined();
        await expect(validate.validator(maxNameData)).resolves.toBeUndefined();
      });

      it('should handle complex valid names with mixed characters', async () => {
        const data = { 
          ...validData, 
          name: "Jean-François O'Brien-Smith" 
        };
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });

      it('should validate password with exactly 8 characters meeting all requirements', async () => {
        const data = { ...validData, password: 'Abc12345' }; // Exactly 8 chars
        await expect(validate.validator(data)).resolves.toBeUndefined();
      });
    });
  });
});