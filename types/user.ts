export interface User {
  id: string // Document ID, typically same as email
  email: string
  firstname: string
  lastname: string
  password?: string
  role?: 'Admin' | 'User'
  createdAt?: Date
  updatedAt?: Date
}
