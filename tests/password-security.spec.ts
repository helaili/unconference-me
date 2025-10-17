import { test, expect } from '@playwright/test'
import { PasswordUtils } from '../server/utils/password'

test.describe('Password Security', () => {
  test('should hash passwords securely', async () => {
    const plainPassword = 'testPassword123!'
    
    // Hash the password
    const hashedPassword = await PasswordUtils.hashPassword(plainPassword)
    
    // Verify it's hashed (not plain text)
    expect(hashedPassword).not.toBe(plainPassword)
    expect(hashedPassword.length).toBeGreaterThan(50) // bcrypt hashes are long
    expect(hashedPassword).toMatch(/^\$2[aby]\$\d{2}\$/) // bcrypt format
    
    // Verify password verification works
    const isValid = await PasswordUtils.verifyPassword(plainPassword, hashedPassword)
    expect(isValid).toBe(true)
    
    // Verify wrong password fails
    const isInvalid = await PasswordUtils.verifyPassword('wrongPassword', hashedPassword)
    expect(isInvalid).toBe(false)
  })

  test('should detect already hashed passwords', async () => {
    const plainPassword = 'testPassword123!'
    const hashedPassword = await PasswordUtils.hashPassword(plainPassword)
    
    expect(PasswordUtils.isPasswordHashed(plainPassword)).toBe(false)
    expect(PasswordUtils.isPasswordHashed(hashedPassword)).toBe(true)
  })

  test('should generate secure random passwords', () => {
    const password1 = PasswordUtils.generateRandomPassword()
    const password2 = PasswordUtils.generateRandomPassword()
    
    expect(password1).not.toBe(password2)
    expect(password1.length).toBe(16)
    expect(password2.length).toBe(16)
    
    // Test custom length
    const shortPassword = PasswordUtils.generateRandomPassword(8)
    expect(shortPassword.length).toBe(8)
  })
})