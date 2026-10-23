import { useState, type ReactNode } from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Typography,
  Avatar,
  Chip,
  AppBar,
  Toolbar,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export interface SidebarNavOption {
  label: string;
  path: string;
  icon: ReactNode;
}

interface DashboardLayoutProps {
  title: string;
  roleBadge: string;
  badgeColor?: 'primary' | 'secondary' | 'info' | 'success';
  navItems: SidebarNavOption[];
  children: ReactNode;
}

const DRAWER_EXPANDED_WIDTH = 240;
const DRAWER_COLLAPSED_WIDTH = 72;

export function DashboardLayout({
  title,
  roleBadge,
  navItems,
  children,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const drawerWidth = collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_EXPANDED_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', width: '100%', background: '#f8fafc' }}>
      {/* ── Collapsible Sidebar ── */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          boxSizing: 'border-box',
          transition: 'width 0.25s ease',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            transition: 'width 0.25s ease',
            overflowX: 'hidden',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            height: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1200,
          },
        }}
      >
        {/* Brand Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            px: collapsed ? 1 : 2.5,
            py: 2,
            minHeight: 64,
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
            }}
            onClick={() => navigate(navItems[0].path)}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                flexShrink: 0,
              }}
            >
              FB
            </Box>
            {!collapsed && (
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: '#0f172a', whiteSpace: 'nowrap' }}>
                Fresher360
              </Typography>
            )}
          </Box>

          {!collapsed && (
            <Tooltip title="Collapse sidebar" placement="left" arrow>
              <IconButton size="small" onClick={() => setCollapsed(true)} sx={{ color: '#64748b' }}>
                <ChevronLeftIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {collapsed && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <Tooltip title="Expand sidebar" placement="right" arrow>
              <IconButton size="small" onClick={() => setCollapsed(false)} sx={{ color: '#64748b' }}>
                <MenuIcon />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Navigation items */}
        <List sx={{ px: 1.5, py: 2 }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const buttonContent = (
              <ListItemButton
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 46,
                  borderRadius: 2,
                  mb: 0.75,
                  px: collapsed ? 1.5 : 2,
                  justifyContent: collapsed ? 'center' : 'initial',
                  background: isActive ? '#eff6ff' : 'transparent',
                  color: isActive ? '#2563eb' : '#475569',
                  '&:hover': {
                    background: isActive ? '#eff6ff' : '#f1f5f9',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: collapsed ? 'auto' : 2,
                    justifyContent: 'center',
                    color: isActive ? '#2563eb' : '#64748b',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: isActive ? 600 : 500 }}>
                        {item.label}
                      </Typography>
                    }
                  />
                )}
              </ListItemButton>
            );

            return (
              <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
                {collapsed ? (
                  <Tooltip title={item.label} placement="right" arrow>
                    {buttonContent}
                  </Tooltip>
                ) : (
                  buttonContent
                )}
              </ListItem>
            );
          })}
        </List>

        {/* User Card at Bottom of Drawer */}
        <Box
          sx={{
            mt: 'auto',
            p: collapsed ? 1.5 : 2,
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            background: '#ffffff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {collapsed ? (
              <Tooltip title={`${user?.first_name ?? 'User'} ${user?.last_name ?? ''} (${roleBadge})`} placement="right" arrow>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: '#2563eb',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'default',
                  }}
                >
                  {user?.first_name?.charAt(0) ?? 'U'}
                </Avatar>
              </Tooltip>
            ) : (
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: '#2563eb',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
              >
                {user?.first_name?.charAt(0) ?? 'U'}
              </Avatar>
            )}
            {!collapsed && (
              <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
                <Typography noWrap sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Chip
                  label={roleBadge}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#2563eb',
                  }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* ── Main Content Area (Full Width) ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          background: '#f8fafc',
        }}
      >
        {/* Top Header */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            color: '#0f172a',
            top: 0,
            zIndex: 1100,
          }}
        >
          <Toolbar sx={{ px: { xs: 2, sm: 4 }, minHeight: 64, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem', color: '#0f172a' }}>
                {title}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                id="header-logout-btn"
                onClick={logout}
                variant="outlined"
                size="small"
                startIcon={<LogoutIcon fontSize="small" />}
                sx={{
                  color: '#64748b',
                  borderColor: '#e2e8f0',
                  borderRadius: 2,
                  px: 1.75,
                  py: 0.6,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': {
                    color: '#ef4444',
                    borderColor: '#fca5a5',
                    background: '#fef2f2',
                  },
                }}
              >
                Logout
              </Button>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page Content Viewport */}
        <Box sx={{ p: { xs: 2.5, sm: 4 }, flexGrow: 1, width: '100%', boxSizing: 'border-box', background: '#f8fafc' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
