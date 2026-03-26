import { HomePage, MessengerPage, ProjectCleanerPage } from '@renderer/pages'

export const appRoutes = [
  // =============== PUBLIC ROUTES ===============
  { path: '/', element: <HomePage />, active: true, protected: false },
  { path: '/messenger', element: <MessengerPage />, active: true, protected: false },
  {
    path: '/project-cleaner',
    element: <ProjectCleanerPage />,
    active: true,
    protected: false
  }

  // { path: '*', element: <NotFoundPage />, active: true, protected: false }
]
