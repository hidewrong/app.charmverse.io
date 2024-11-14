import 'server-only';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import type { SessionUser } from '@packages/scoutgame/session/interfaces';
import { PurchaseProvider } from '@packages/scoutgame-ui/providers/PurchaseProvider';
import { SnackbarProvider } from '@packages/scoutgame-ui/providers/SnackbarContext';
import { UserProvider } from '@packages/scoutgame-ui/providers/UserProvider';
import type { ReactNode } from 'react';

import theme from '../theme/theme';

export function AppProviders({ children, user }: { children: ReactNode; user: SessionUser | null }) {
  return (
    <AppRouterCacheProvider options={{ key: 'css' }}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <UserProvider userSession={user}>
          <SnackbarProvider>
            <PurchaseProvider>{children}</PurchaseProvider>
          </SnackbarProvider>
        </UserProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
