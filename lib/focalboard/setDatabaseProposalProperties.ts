import { InvalidInputError } from '@charmverse/core/errors';
import { ProposalStatus, prisma } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import { getBoardColorFromColor } from 'components/common/BoardEditor/focalboard/src/constants';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import { proposalDbProperties, proposalStatusBoardColors } from 'lib/focalboard/proposalDbProperties';
import { InvalidStateError } from 'lib/middleware';

export async function generateUpdatedProposalCategoryProperty({
  boardProperties,
  spaceId
}: {
  boardProperties: IPropertyTemplate[];
  spaceId: string;
}) {
  if (!spaceId) {
    throw new InvalidInputError(`Space ID required to generate proposal categories`);
  }

  const proposalCategories = await prisma.proposalCategory.findMany({
    where: {
      spaceId
    },
    select: {
      id: true,
      color: true,
      title: true
    }
  });

  // We will mutate and return this property
  const proposalCategoryProp = {
    ...(boardProperties.find((p) => p.type === 'proposalCategory') ?? {
      ...proposalDbProperties.proposalCategory(),
      id: uuid()
    })
  };

  proposalCategories.forEach((c) => {
    const existingPropertyValue = proposalCategoryProp.options.find((opt) => opt.id === c.id);

    if (!existingPropertyValue) {
      proposalCategoryProp.options.push({
        id: c.id,
        value: c.title,
        color: getBoardColorFromColor(c.color)
      });
    } else {
      existingPropertyValue.value = c.title;
    }
  });

  return proposalCategoryProp;
}

export async function generateUpdatedProposalStatusProperty({
  boardProperties
}: {
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalStatus') ?? {
      ...proposalDbProperties.proposalStatus(),
      id: uuid()
    })
  };

  if (proposalStatusProp) {
    [...objectUtils.typedKeys(ProposalStatus), 'archived'].forEach((status) => {
      if (status !== 'draft') {
        const existingOption = proposalStatusProp.options.find((opt) => opt.value === status);
        if (!existingOption) {
          proposalStatusProp.options.push({
            color: proposalStatusBoardColors[status as Exclude<ProposalStatus, 'draft'> | 'archived'],
            id: uuid(),
            value: status
          });
        }
      }
    });
    return proposalStatusProp;
  }

  return proposalStatusProp;
}
export async function generateUpdatedProposalUrlProperty({
  boardProperties
}: {
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalUrl') ?? {
      ...proposalDbProperties.proposalUrl(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}

export async function generateUpdatedProposalEvaluatedByProperty({
  boardProperties
}: {
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalEvaluatedBy') ?? {
      ...proposalDbProperties.proposalEvaluatedBy(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}

export async function generateUpdatedProposalEvaluationTotalProperty({
  boardProperties
}: {
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalEvaluationTotal') ?? {
      ...proposalDbProperties.proposalEvaluationTotal(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}

export async function generateUpdatedProposalEvaluationAverageProperty({
  boardProperties
}: {
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalEvaluationAverage') ?? {
      ...proposalDbProperties.proposalEvaluationAverage(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}

export async function setDatabaseProposalProperties({ databaseId }: { databaseId: string }): Promise<Board> {
  const database = (await prisma.block.findUniqueOrThrow({
    where: {
      id: databaseId
    }
  })) as any as Board;

  const boardProperties = database.fields.cardProperties ?? [];

  if (database.fields.sourceType !== 'proposals') {
    throw new InvalidStateError(`Cannot add proposal cards to a database which does not have proposals as its source`);
  }

  const [categoryProp, statusProp, proposalUrlProp] = await Promise.all([
    generateUpdatedProposalCategoryProperty({ boardProperties, spaceId: database.spaceId }),
    generateUpdatedProposalStatusProperty({ boardProperties }),
    generateUpdatedProposalUrlProperty({ boardProperties })
  ]);

  const existingCategoryPropIndex = boardProperties.findIndex((p) => p.type === 'proposalCategory');

  if (existingCategoryPropIndex > -1) {
    boardProperties[existingCategoryPropIndex] = categoryProp;
  } else {
    boardProperties.push(categoryProp);
  }

  const existingStatusPropIndex = boardProperties.findIndex((p) => p.type === 'proposalStatus');

  if (existingStatusPropIndex > -1) {
    boardProperties[existingStatusPropIndex] = statusProp;
  } else {
    boardProperties.push(statusProp);
  }

  const existingUrlPropIndex = boardProperties.findIndex((p) => p.type === 'proposalUrl');

  if (existingUrlPropIndex > -1) {
    boardProperties[existingUrlPropIndex] = proposalUrlProp;
  } else {
    boardProperties.push(proposalUrlProp);
  }

  const spaceUsesRubrics =
    (await prisma.proposal.findFirst({
      where: {
        spaceId: database.spaceId,
        evaluationType: 'rubric'
      },
      select: {
        id: true
      }
    })) !== null;

  if (spaceUsesRubrics) {
    const [evaluatedByProp, evaluationTotalProp, evaluationAverageProp] = await Promise.all([
      generateUpdatedProposalEvaluatedByProperty({ boardProperties }),
      generateUpdatedProposalEvaluationTotalProperty({ boardProperties }),
      generateUpdatedProposalEvaluationAverageProperty({ boardProperties })
    ]);

    const existingEvaluatedByPropPropIndex = boardProperties.findIndex((p) => p.type === 'proposalEvaluatedBy');

    if (existingEvaluatedByPropPropIndex > -1) {
      boardProperties[existingEvaluatedByPropPropIndex] = evaluatedByProp;
    } else {
      boardProperties.push(evaluatedByProp);
    }

    const existingEvaluationTotalPropIndex = boardProperties.findIndex((p) => p.type === 'proposalEvaluationTotal');

    if (existingEvaluationTotalPropIndex > -1) {
      boardProperties[existingEvaluationTotalPropIndex] = evaluationTotalProp;
    } else {
      boardProperties.push(evaluationTotalProp);
    }

    const existingEvaluationAveragePropIndex = boardProperties.findIndex((p) => p.type === 'proposalEvaluationAverage');

    if (existingEvaluationAveragePropIndex > -1) {
      boardProperties[existingEvaluationAveragePropIndex] = evaluationAverageProp;
    } else {
      boardProperties.push(evaluationAverageProp);
    }
  }

  return prisma.block.update({
    where: {
      id: database.id
    },
    data: {
      fields: {
        ...(database.fields as any),
        cardProperties: boardProperties
      }
    }
  }) as any as Board;
}
