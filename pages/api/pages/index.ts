
import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { IEventToLog, postToDiscord } from 'lib/log/userEvents';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { IPageWithPermissions } from 'lib/pages/server';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { computeSpacePermissions } from 'lib/permissions/spaces';
import { InvalidInputError, UnauthorisedActionError } from 'lib/utilities/errors';

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(createPage);

async function createPage (req: NextApiRequest, res: NextApiResponse<IPageWithPermissions>) {
  const data = req.body as Prisma.PageCreateInput;

  const spaceId = data.space?.connect?.id;

  if (!spaceId) {
    throw new InvalidInputError('A space id is required to create a page');
  }

  const { id: userId } = req.session.user;

  const permissions = await computeSpacePermissions({
    allowAdminBypass: true,
    resourceId: spaceId,
    userId
  });

  if (!permissions.createPage) {
    throw new UnauthorisedActionError('You do not have permissions to create a page.');
  }

  const page = await prisma.page.create({ data });
  const pageWithPermissions = await setupPermissionsAfterPageCreated(page.id);

  logFirstWorkspacePageCreation(page);
  logFirstUserPageCreation(page);
  return res.status(201).json(pageWithPermissions);
}

export default withSessionRoute(handler);

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
async function logFirstWorkspacePageCreation (page: Page) {
  const workspaceCreatedPages = await prisma.page.count({
    where: {
      spaceId: page.spaceId,
      autoGenerated: {
        not: true
      }
    }
  });

  // Default page plus the just created page
  if (workspaceCreatedPages === 1) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_workspace_create_page',
      funnelStage: 'activation',
      message: `First page created in ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}

/**
 * Assumes that a first page will be created by the system
 * Should be called after a page is created
 * @param page
 */
async function logFirstUserPageCreation (page: Page) {
  const userCreatedPages = await prisma.page.count({
    where: {
      createdBy: page.createdBy,
      autoGenerated: {
        not: true
      }
    }
  });

  // Default page plus the just created page
  if (userCreatedPages === 1) {

    const space = await prisma.space.findUnique({
      where: {
        id: page.spaceId!
      }
    });

    const eventLog: IEventToLog = {
      eventType: 'first_user_create_page',
      funnelStage: 'activation',
      message: `A user just created their first page. This happened in the ${space!.domain} workspace`
    };

    postToDiscord(eventLog);
  }
}
