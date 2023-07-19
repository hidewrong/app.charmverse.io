import { Stack } from '@mui/material';
import type { KeyedMutator } from 'swr';

import { useUser } from 'hooks/useUser';
import type { NFTData } from 'lib/blockchain/getNFTs';
import type { ExtendedPoap } from 'lib/blockchain/interfaces';

import { NftsList } from '../NftsList';
import { PoapsList } from '../PoapsList';

import { ProfileWidget } from './ProfileWidget';

export function CollectionWidget({
  userId,
  mutateNfts,
  nfts,
  poaps
}: {
  userId: string;
  nfts: NFTData[];
  poaps: ExtendedPoap[];
  mutateNfts: KeyedMutator<NFTData[]>;
}) {
  const { user } = useUser();

  return (
    <ProfileWidget title='Collection'>
      <Stack spacing={2}>
        {nfts.length !== 0 && (
          <NftsList userId={userId} nfts={nfts} mutateNfts={mutateNfts} readOnly={user?.id !== userId} />
        )}
        {poaps.length !== 0 && <PoapsList poaps={poaps} />}
      </Stack>
    </ProfileWidget>
  );
}
