import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  if (!body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password is required'
    })
  }

  if (body.password !== config.cmsPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password'
    })
  }

  // Generate JWT token
  const token = jwt.sign(
    { role: 'admin', iat: Date.now() },
    config.jwtSecret,
    { expiresIn: '24h' }
  )

  // Set cookie (not httpOnly so client middleware can read it)
  setCookie(event, 'cms-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 // 24 hours
  })

  return { success: true, message: 'Logged in successfully' }
})
