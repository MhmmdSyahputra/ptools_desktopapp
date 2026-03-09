import { HomePage } from '@renderer/pages'

export const appRoutes = [
  // =============== PUBLIC ROUTES ===============
  { path: '/', element: <HomePage />, active: true, protected: false }

  // { path: '*', element: <NotFoundPage />, active: true, protected: false }
]
