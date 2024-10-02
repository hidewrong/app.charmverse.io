import { Box, Button, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export function SuccessView({ builder }: { builder: { nftImageUrl?: string | null; username: string } }) {
  return (
    <Stack gap={2} textAlign='center'>
      <Typography color='secondary' variant='h5' fontWeight={600}>
        Congratulations!
      </Typography>
      <Typography>You scouted @{builder.username}</Typography>
      <Box
        bgcolor='black.dark'
        width='100%'
        p={2}
        display='flex'
        alignItems='center'
        flexDirection='column'
        gap={1}
        py={12}
        sx={{
          background: 'url(/images/nft-mint-bg.png)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        {builder.nftImageUrl ? (
          <Image
            src={builder.nftImageUrl}
            alt={builder.username}
            width={200}
            height={300}
            style={{ aspectRatio: '1/1.4', width: '50%', height: '50%' }}
          />
        ) : (
          <Image src='/images/no_nft_person.png' alt='no nft image available' width={200} height={200} />
        )}
      </Box>
      <Button
        LinkComponent={Link}
        fullWidth
        href={`https://warpcast.com/~/compose?text=${encodeURI(
          `I scouted ${builder.username} on Scout Game!`
        )}&embeds[]=${window.location.origin}/u/${builder.username}`}
        target='_blank'
        rel='noopener noreferrer'
      >
        Share now
      </Button>
    </Stack>
  );
}
