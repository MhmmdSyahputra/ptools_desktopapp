import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  alpha
} from '@mui/material'
import {
  HomeRounded,
  AppsRounded,
  SettingsRounded,
  ForumRounded,
  CleaningServicesRounded,
  ChevronRightRounded,
  ChevronLeftRounded
} from '@mui/icons-material'
import { useSidebarBadges } from '@renderer/context/sidebarBadge'

const getRouteMeta = (route, index) => {
  const path = route.path ?? '/'

  if (path === '/') {
    return { icon: HomeRounded, label: 'Home' }
  }

  if (path === '/messenger') {
    return { icon: ForumRounded, label: 'Messenger' }
  }

  if (path === '/project-cleaner') {
    return { icon: CleaningServicesRounded, label: 'Project Cleaner' }
  }

  return {
    icon: index % 2 === 0 ? AppsRounded : ForumRounded,
    label: path.replace('/', '') || 'Menu'
  }
}

// eslint-disable-next-line react/prop-types
export const Sidebar = ({ routes = [] }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(true)
  const badges = useSidebarBadges()

  const menuItems = useMemo(() => {
    return routes
      .filter((r) => r.active)
      .map((route, index) => {
        const meta = getRouteMeta(route, index)
        return {
          ...route,
          ...meta
        }
      })
  }, [routes])

  return (
    <Box
      sx={{
        mt: '40px',
        width: collapsed ? 84 : 220,
        minWidth: collapsed ? 84 : 220,
        height: 'calc(100vh - 40px)',
        bgcolor: '#14181d',
        borderRight: `1px solid ${alpha('#ffffff', 0.08)}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 1.5,
        px: collapsed ? 1 : 1.25,
        transition: 'width 240ms ease, min-width 240ms ease, padding 240ms ease'
      }}
    >
      <Tooltip
        title={collapsed ? 'Tampilkan label menu' : 'Sembunyikan label menu'}
        placement="right"
      >
        <IconButton
          size="small"
          onClick={() => setCollapsed((prev) => !prev)}
          sx={{
            alignSelf: collapsed ? 'center' : 'flex-end',
            color: alpha('#ffffff', 0.78),
            mb: 1,
            transition: 'all 200ms ease'
          }}
        >
          {collapsed ? <ChevronRightRounded /> : <ChevronLeftRounded />}
        </IconButton>
      </Tooltip>

      <List sx={{ width: '100%', px: 0 }}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const selected = location.pathname === item.path

          return (
            <Tooltip
              key={item.path}
              title={collapsed ? item.label : ''}
              placement="right"
              disableHoverListener={!collapsed}
            >
              <ListItemButton
                selected={selected}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 3,
                  minHeight: 48,
                  mb: 0.75,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 1 : 1.25,
                  color: alpha('#ffffff', 0.74),
                  '& .MuiListItemIcon-root': {
                    minWidth: collapsed ? 0 : 38,
                    justifyContent: 'center'
                  },
                  '&.Mui-selected': {
                    color: '#56e07f',
                    bgcolor: alpha('#56e07f', 0.1)
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: alpha('#56e07f', 0.16)
                  },
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.05)
                  }
                }}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  {item.path === '/messenger' && badges.messenger > 0 ? (
                    <Badge
                      badgeContent={badges.messenger}
                      max={99}
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: '#e05c5c',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          minWidth: 16,
                          height: 16,
                          padding: '0 4px',
                          fontFamily: '"IBM Plex Mono", monospace'
                        }
                      }}
                    >
                      <Icon fontSize="medium" />
                    </Badge>
                  ) : (
                    <Icon fontSize="medium" />
                  )}
                </ListItemIcon>

                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: selected ? 700 : 500,
                      textTransform: 'capitalize'
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          )
        })}
      </List>

      <Divider sx={{ mt: 1, mb: 2, width: '85%', borderColor: alpha('#ffffff', 0.1) }} />

      <List sx={{ width: '100%', px: 0 }}>
        <Tooltip
          title={collapsed ? 'Settings' : ''}
          placement="right"
          disableHoverListener={!collapsed}
        >
          <ListItemButton
            sx={{
              borderRadius: 3,
              minHeight: 48,
              justifyContent: collapsed ? 'center' : 'flex-start',
              px: collapsed ? 1 : 1.25,
              color: alpha('#ffffff', 0.74),
              '& .MuiListItemIcon-root': {
                minWidth: collapsed ? 0 : 38,
                justifyContent: 'center'
              },
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.05)
              }
            }}
          >
            <ListItemIcon sx={{ color: 'inherit' }}>
              <SettingsRounded fontSize="medium" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </List>

      <Box sx={{ mt: 'auto', width: '100%', display: 'flex', justifyContent: 'center', pb: 0.5 }}>
        <Tooltip
          title={collapsed ? 'Profile' : ''}
          placement="right"
          disableHoverListener={!collapsed}
        >
          <Box
            sx={{
              width: '100%',
              px: collapsed ? 0 : 1,
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: 1
            }}
          >
            <Avatar
              sx={{
                width: 38,
                height: 38,
                bgcolor: '#1f2630',
                color: '#c9d2de',
                fontSize: 14,
                fontWeight: 700
              }}
            >
              PT
            </Avatar>
            {!collapsed && (
              <Box>
                <Typography sx={{ color: '#e6edf5', fontSize: 13, fontWeight: 600 }}>
                  PTools User
                </Typography>
                <Typography sx={{ color: alpha('#e6edf5', 0.55), fontSize: 12 }}>
                  Desktop Mode
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}
