import { Box, Typography } from '@mui/material';

import type { TokenGateState } from './hooks/useTokenGates';
import { TokenGateOption } from './TokenGateOption';

export type TokenGateContentProps = Pick<TokenGateState, 'tokenGates' | 'tokenGateResult' | 'isVerifying'>;

export function TokenGateContent({ tokenGates, tokenGateResult, isVerifying }: TokenGateContentProps) {
  return (
    <div data-test='token-gate-form'>
      {tokenGates?.map((gate, index, list) => (
        <Box mb={2} key={gate.id}>
          <TokenGateOption
            tokenGate={gate}
            isVerifying={isVerifying}
            isVerified={tokenGateResult ? tokenGateResult.gateTokens.some((g) => g.tokenGate.id === gate.id) : null}
          />
          {index < list.length - 1 && (
            <Typography color='secondary' align='center'>
              OR
            </Typography>
          )}
        </Box>
      ))}
    </div>
  );
}
