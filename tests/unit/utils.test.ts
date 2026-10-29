import { describe, expect, it } from 'vitest'
import { cn } from '~/lib/utils'

describe('cn', () => {
  it('merges classes and resolves Tailwind conflicts', () => {
    const isHidden = false
    expect(cn('p-2', 'p-4', isHidden && 'hidden')).toBe('p-4')
  })

  it('keeps a type role next to a status tone', () => {
    expect(cn('type-row', 'text-emerald-600')).toBe('type-row text-emerald-600')
  })

  it('treats theme text sizes as sizes, not colors', () => {
    expect(cn('text-muted-foreground', 'text-body')).toBe('text-muted-foreground text-body')
  })

  it('lets the last type role win', () => {
    expect(cn('type-body', 'type-meta')).toBe('type-meta')
  })
})
