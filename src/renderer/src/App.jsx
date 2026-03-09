import { MemoryRouter as Router, Routes, Route } from 'react-router-dom'
import { appRoutes } from './routes/appRoutes'
import { Box } from '@mui/material'
import { TitleBar } from './components/core/titlebar'

// eslint-disable-next-line react/prop-types
const SidebarLayout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <TitleBar showUpdateButton={true} />

      {/* <Sidebar
        logo={`${assetsPathConfig}\\images\\logo.png`}
        onLogout={handleLogout}
        sidebarService={sidebarService}
        appRoutes={appRoutes}
      /> */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          // p: 3,
          bgcolor: 'grey.50',
          overflow: 'auto',
          mt: '30px'
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

const renderRoute = (route, key) => {
  const { element, path } = route

  // if (!isProtected && (path === '/login' || path === '/xyz/info')) {
  //   return <Route key={key} path={path} element={<LoginOnlyLayout>{element}</LoginOnlyLayout>} />
  // }

  // if (!isProtected) {
  //   return <Route key={key} path={path} element={<SidebarLogLayout>{element}</SidebarLogLayout>} />
  // }

  return <Route key={key} path={path} element={<SidebarLayout>{element}</SidebarLayout>} />
}

const App = () => {
  return (
    <Router>
      <Routes>
        {appRoutes.filter((r) => r.active).map((route, i) => renderRoute(route, i))}
        {/* 404 */}
        <Route path="*" element={<p>not found</p>} />
      </Routes>
    </Router>
  )
}

export default App
