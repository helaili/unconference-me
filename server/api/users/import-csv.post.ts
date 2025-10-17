import { z } from 'zod'
import { userService } from '../../services/userService'
import crypto from 'crypto'

const bodySchema = z.object({
  csvData: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  try {
    // Check if user is admin
    const session = await requireUserSession(event)
    const userRole = (session.user as { role?: string })?.role
    
    if (userRole !== 'Admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only admins can import users'
        }
      })
    }
    
    const body = await readValidatedBody(event, bodySchema.parse)
    
    console.log('Admin importing users from CSV')
    
    // Parse CSV data
    const lines = body.csvData.trim().split('\n')
    const headers = lines[0]?.toLowerCase().split(',').map(h => h.trim())
    
    if (!headers || !headers.includes('firstname') || !headers.includes('lastname') || !headers.includes('email')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid CSV format',
        data: { 
          success: false, 
          message: 'CSV must contain headers: firstname, lastname, email'
        }
      })
    }
    
    const firstnameIndex = headers.indexOf('firstname')
    const lastnameIndex = headers.indexOf('lastname')
    const emailIndex = headers.indexOf('email')
    
    let imported = 0
    const errors: string[] = []
    
    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]?.trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim())
      const firstname = values[firstnameIndex]
      const lastname = values[lastnameIndex]
      const email = values[emailIndex]
      
      if (!firstname || !lastname || !email) {
        errors.push(`Line ${i + 1}: Missing required fields`)
        continue
      }
      
      // Check if email is valid
      if (!email.includes('@')) {
        errors.push(`Line ${i + 1}: Invalid email: ${email}`)
        continue
      }
      
      try {
        // Check if user already exists
        const existingUser = await userService.findByEmail(email)
        if (existingUser) {
          errors.push(`Line ${i + 1}: User already exists: ${email}`)
          continue
        }
        
        // Generate registration token
        const registrationToken = crypto.randomBytes(32).toString('hex')
        const registrationTokenExpiry = new Date()
        registrationTokenExpiry.setDate(registrationTokenExpiry.getDate() + 30) // 30 days expiry
        
        // Create user
        await userService.create({
          firstname,
          lastname,
          email,
          role: 'Participant',
          registrationToken,
          registrationTokenExpiry,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        
        imported++
      } catch (error) {
        errors.push(`Line ${i + 1}: Failed to create user: ${email}`)
      }
    }
    
    console.log(`Admin imported ${imported} users from CSV`)
    
    return { 
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.warn('CSV import validation error:', error.message)
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation Error',
        data: { 
          success: false, 
          message: 'Please check your input',
          errors: error.message
        }
      })
    }
    throw error
  }
})
