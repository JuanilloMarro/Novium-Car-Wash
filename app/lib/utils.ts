import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// Keep in sync with the --text-* tokens and type-* utilities in main.css
const TEXT_SIZES = ['display', 'page', 'heading', 'title', 'row', 'body', 'option', 'value', 'field', 'label', 'meta', 'status', 'micro', 'input']
const TYPE_ROLES = ['display', 'page', 'heading', 'title', 'row', 'body', 'option', 'value', 'field', 'label', 'meta', 'status', 'micro']

const twMerge = extendTailwindMerge<'type-role'>({
  extend: {
    classGroups: {
      'font-size': [{ text: TEXT_SIZES }],
      'type-role': [{ type: TYPE_ROLES }],
      'text-color': [{ text: ['subtle-foreground'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
