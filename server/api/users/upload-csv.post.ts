import logger from '../../../utils/logger'
import { mockData } from '../../../tests/helpers/mock-manager'

export default defineEventHandler(async (event) => {
  try {
    // Require authentication and admin role
    const session = await requireUserSession(event)
    const sessionUser = session.user as { role?: string }
    
    if (sessionUser.role !== 'Admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden',
        data: { 
          success: false, 
          message: 'Only administrators can upload CSV files'
        }
      })
    }

    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded',
        data: { 
          success: false, 
          message: 'Please upload a CSV file'
        }
      })
    }

    const fileData = formData[0]
    if (!fileData || !fileData.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file',
        data: { 
          success: false, 
          message: 'Invalid file data'
        }
      })
    }

    // Parse CSV
    const csvContent = fileData.data.toString('utf-8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid CSV',
        data: { 
          success: false, 
          message: 'CSV file must have at least a header row and one data row'
        }
      })
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase())
    const firstnameIndex = header.indexOf('firstname')
    const lastnameIndex = header.indexOf('lastname')
    const emailIndex = header.indexOf('email')

    if (firstnameIndex === -1 || lastnameIndex === -1 || emailIndex === -1) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid CSV format',
        data: { 
          success: false, 
          message: 'CSV must have columns: firstname, lastname, email'
        }
      })
    }

    // Parse data rows
    let addedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const values = line.split(',').map(v => v.trim())
      
      if (values.length < 3) {
        errors.push(`Line ${i + 1}: Invalid number of columns`)
        continue
      }

      const firstname = values[firstnameIndex]
      const lastname = values[lastnameIndex]
      const email = values[emailIndex]

      // Validate email format
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Line ${i + 1}: Invalid email format`)
        continue
      }

      // Check if user already exists
      const existingUser = mockData.getUserByEmail(email)
      if (existingUser) {
        skippedCount++
        continue
      }

      // Add user
      try {
        const newUser = {
          id: crypto.randomUUID(),
          email,
          firstname: firstname || 'Unknown',
          lastname: lastname || 'User',
          role: 'Participant' as const,
          registeredAt: new Date(),
          updatedAt: new Date()
        }
        
        mockData.addUser(newUser)
        addedCount++
      } catch (err) {
        errors.push(`Line ${i + 1}: Failed to add user`)
      }
    }

    logger.info(`CSV upload completed: ${addedCount} added, ${skippedCount} skipped`)
    
    return {
      success: true,
      message: 'CSV processed successfully',
      count: addedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors : undefined
    }
  } catch (error) {
    logger.error('Error uploading CSV:', error)
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload CSV',
      data: { 
        success: false, 
        message: 'An error occurred while processing the CSV file'
      }
    })
  }
})
