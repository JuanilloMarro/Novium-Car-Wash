import { expect, test } from '@playwright/test'

test('la landing carga', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Novium CarWash' })).toBeVisible()
})
