import { describe, expect, it } from 'vitest';
import { cn } from '../lib/utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const result = cn('base-class', false, 'another-class');
    expect(result).toBe('base-class another-class');
  });

  it('should handle undefined and null values', () => {
    const result = cn('class-1', undefined, null, 'class-2');
    expect(result).toBe('class-1 class-2');
  });

  it('should merge tailwind classes properly with conflict resolution', () => {
    const result = cn('px-2', 'px-4');
    expect(result).toBe('px-4');
  });

  it('should merge complex tailwind classes', () => {
    const result = cn('text-gray-500 text-sm', 'text-blue-600 text-lg');
    expect(result).toBe('text-lg text-blue-600');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class-1', 'class-2'], 'class-3');
    expect(result).toBe('class-1 class-2 class-3');
  });

  it('should handle object syntax', () => {
    const result = cn({
      'active-class': true,
      'inactive-class': false,
      'another-active': true,
    });
    expect(result).toBe('active-class another-active');
  });

  it('should handle empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle mixed input types', () => {
    const result = cn(
      'base',
      ['array-class'],
      { 'object-class': true },
      undefined,
      null,
      false,
      'final'
    );
    expect(result).toBe('base array-class object-class final');
  });

  it('should preserve non-conflicting tailwind classes', () => {
    const result = cn('mt-4 mb-4', 'mr-2 ml-2');
    expect(result).toBe('mt-4 mb-4 ml-2 mr-2');
  });
});
