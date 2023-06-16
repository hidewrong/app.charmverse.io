import { usePage } from 'hooks/usePage';
import { useProposal } from 'hooks/useProposal';

import ShareToWeb from '../common/ShareToWeb';

type Props = {
  pageId: string;
};

export default function FreeShareToWeb({ pageId }: Props) {
  const { page: currentPage } = usePage({ pageIdOrPath: pageId });

  const { proposal } = useProposal({ proposalId: currentPage?.proposalId });

  const shareAlertMessage =
    currentPage?.type === 'proposal' && proposal?.status === 'draft'
      ? 'This draft is only visible to authors and reviewers until it is progressed to the discussion stage.'
      : currentPage?.type === 'proposal' && proposal?.status !== 'draft'
      ? 'Proposals in discussion stage and beyond are publicly visible.'
      : null;

  const isChecked =
    // If space has public proposals, don't interfere with non-proposal pages
    currentPage?.type !== 'proposal' ||
    // All proposals beyond draft are public
    (currentPage?.type === 'proposal' && proposal?.status !== 'draft');

  return <ShareToWeb disabled pageId={pageId} toggleChecked={isChecked} shareAlertMessage={shareAlertMessage} />;
}
