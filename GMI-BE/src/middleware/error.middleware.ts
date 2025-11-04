import { Request, Response, NextFunction } from 'express'

export const errorMiddleware = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('[Error]', error)

  // Prisma errors
  if (error.code === 'P2002') {
    res.status(400).json({
      error: 'Duplicate entry',
      message: 'This record already exists'
    })
    return
  }

  if (error.code === 'P2025') {
    res.status(404).json({
      error: 'Not found',
      message: 'Record not found'
    })
    return
  }

  // Validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation failed',
      message: error.message
    })
    return
  }

  // Default error
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
}

export const notFoundMiddleware = (
  req: Request,
  res: Response
) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  })
}
