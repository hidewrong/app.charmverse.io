'use server';

import { log } from '@charmverse/core/log';
import { authActionClient } from '@connect-shared/lib/actions/actionClient';
import { storeUpdatedProjectMetadataAttestation } from '@connect-shared/lib/attestations/storeUpdatedProjectMetadataAttestation';
import type { EditOptimismProjectValues } from '@connect-shared/lib/projects/editOptimismProject';
import { editOptimismProject } from '@connect-shared/lib/projects/editOptimismProject';
import { generateOgImage } from '@connect-shared/lib/projects/generateOgImage';
import { disableCredentialAutopublish } from '@root/lib/credentials/constants';
import { revalidatePath } from 'next/cache';

import { schema } from './form';

export const editProjectAction = authActionClient
  .metadata({ actionName: 'create-project' })
  .schema(schema)
  .action(async ({ parsedInput, ctx }) => {
    const input = parsedInput;
    const currentUserId = ctx.session.user!.id;
    const editedProject = await editOptimismProject({
      userId: currentUserId,
      input: { ...input, projectId: input.id } as EditOptimismProjectValues
    });

    await generateOgImage(editedProject.id, currentUserId);

    if (!disableCredentialAutopublish) {
      await storeUpdatedProjectMetadataAttestation({
        projectId: editedProject.id,
        userId: currentUserId
      }).catch((err) => {
        log.error('Failed to store and publish updated project metadata attestation', { err, userId: currentUserId });
      });
    }

    revalidatePath(`/p/${editedProject.path}`);

    return { success: true };
  });
