import { log } from '@charmverse/core/log';
import type { CredentialEventType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getChainById } from 'connectors/chains';
import { Wallet, providers } from 'ethers';

import { credentialsWalletPrivateKey } from 'config/constants';

import { getEasInstance, type EasSchemaChain } from './connectors';
import { attestationSchemaIds, encodeAttestation } from './schemas';
import type { AttestationType, CredentialDataInput } from './schemas';

export type OnChainAttestationInput<T extends AttestationType = AttestationType> = {
  chainId: EasSchemaChain;
  credentialInputs: { recipient: string | null; data: CredentialDataInput<T> };
  type: T;
};

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

export async function attestOnchain({ credentialInputs, type, chainId }: OnChainAttestationInput): Promise<string> {
  const schemaId = attestationSchemaIds[type];
  const rpcUrl = getChainById(chainId)?.rpcUrls[0];

  // This solution fixes ethers 5.7 not working with recent Next.js v14+ versions
  // https://github.com/ethers-io/ethers.js/issues/4469#issuecomment-1932145334
  const provider = new providers.JsonRpcProvider({
    url: rpcUrl as string,
    skipFetchSetup: true
  });

  const wallet = new Wallet(credentialsWalletPrivateKey as string, provider);

  const eas = getEasInstance(chainId);

  eas.connect(wallet);

  const attestationUid = await eas
    .attest({
      schema: schemaId,
      data: {
        recipient: credentialInputs.recipient ?? NULL_ADDRESS,
        data: encodeAttestation({ type, data: credentialInputs.data })
      }
    })
    .then((tx) => tx.wait());

  log.info(`Issued ${type} credential on chain ${chainId}`);

  return attestationUid;
}

export type OnChainAttestationInputWithMetadata<T extends AttestationType = AttestationType> = {
  credential: OnChainAttestationInput<T>;
  credentialMetadata: {
    event: CredentialEventType;
    proposalId?: string;
    submissionId?: string;
    userId?: string;
    credentialTemplateId?: string;
  };
};

export async function attestOnChainAndRecordCredential({
  credential,
  credentialMetadata
}: OnChainAttestationInputWithMetadata) {
  const attestationUid = await attestOnchain(credential);

  await prisma.issuedCredential.create({
    data: {
      onchainAttestationId: attestationUid,
      onchainChainId: credential.chainId,
      credentialEvent: credentialMetadata.event,
      credentialTemplate: { connect: { id: credentialMetadata.credentialTemplateId } },
      user: { connect: { id: credentialMetadata.userId } },
      schemaId: attestationSchemaIds[credential.type],
      rewardApplication: credentialMetadata.submissionId
        ? { connect: { id: credentialMetadata.submissionId } }
        : undefined,
      proposal: credentialMetadata.proposalId ? { connect: { id: credentialMetadata.proposalId } } : undefined
    }
  });
}
