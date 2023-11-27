import type { PageMeta } from '@charmverse/core/pages';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import { Box, Tooltip } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import React from 'react';
import { mutate } from 'swr';

import { ViewFilterControl } from 'components/common/BoardEditor/components/ViewFilterControl';
import { ViewSortControl } from 'components/common/BoardEditor/components/ViewSortControl';
import Link from 'components/common/Link';
import { usePages } from 'hooks/usePages';
import type { Board, IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

import { mutator } from '../../mutator';
import { getCurrentBoardTemplates } from '../../store/cards';
import { useAppSelector } from '../../store/hooks';
import IconButton from '../../widgets/buttons/iconButton';
import AddViewMenu from '../addViewMenu';

import NewCardButton from './newCardButton';
import ViewHeaderActionsMenu from './viewHeaderActionsMenu';
import ViewHeaderDisplayByMenu from './viewHeaderDisplayByMenu';
import ViewTabs from './viewTabs';

type Props = {
  activeBoard?: Board;
  activeView?: BoardView;
  views: BoardView[];
  viewsBoard: Board; // the parent board which keeps track of the views on this page
  cards: Card[];
  addCard: () => void;
  showCard: (cardId: string | null) => void;
  // addCardFromTemplate: (cardTemplateId: string) => void
  addCardTemplate: () => void;
  editCardTemplate: (cardTemplateId: string) => void;
  readOnly: boolean;
  dateDisplayProperty?: IPropertyTemplate;
  disableUpdatingUrl?: boolean;
  maxTabsShown?: number;
  onClickNewView?: () => void;
  onDeleteView?: (viewId: string) => void;
  showActionsOnHover?: boolean;
  showView: (viewId: string) => void;
  embeddedBoardPath?: string;
  toggleViewOptions: (open?: boolean) => void;
};

function ViewHeader(props: Props) {
  const router = useRouter();
  const { pages, refreshPage } = usePages();
  const cardTemplates: Card[] = useAppSelector(getCurrentBoardTemplates);
  const viewSortPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });

  const views = props.views.filter((view) => !view.fields.inline);

  const {
    maxTabsShown = 3,
    showView,
    toggleViewOptions,
    viewsBoard,
    activeBoard,
    onClickNewView,
    activeView,
    cards,
    dateDisplayProperty
  } = props;

  const withDisplayBy = activeView?.fields.viewType === 'calendar';
  const withSortBy = activeView?.fields.viewType !== 'calendar';

  async function addPageFromTemplate(pageId: string) {
    const [blocks] = await mutator.duplicateCard({
      board: activeBoard as Board,
      cardId: pageId,
      cardPage: pages[pageId] as PageMeta
    });
    const newPageId = blocks[0].id;
    await refreshPage(newPageId);
    props.showCard(newPageId);
  }

  async function deleteCardTemplate(pageId: string) {
    const card = cardTemplates.find((c) => c.id === pageId);
    if (card) {
      await mutator.deleteBlock(card, 'delete card');
      mutate(`pages/${card.spaceId}`);
    }
  }

  return (
    <div key={viewsBoard.id} className={`ViewHeader ${props.showActionsOnHover ? 'hide-actions' : ''}`}>
      <ViewTabs
        onDeleteView={props.onDeleteView}
        onClickNewView={onClickNewView}
        board={viewsBoard}
        views={views}
        readOnly={props.readOnly}
        showView={showView}
        activeView={activeView}
        disableUpdatingUrl={props.disableUpdatingUrl}
        maxTabsShown={maxTabsShown}
        openViewOptions={() => toggleViewOptions(true)}
      />

      {/* add a view */}

      {!props.readOnly && views.length <= maxTabsShown && (
        <Box className='view-actions' pt='4px'>
          <AddViewMenu
            board={viewsBoard}
            activeView={activeView}
            views={views}
            showView={showView}
            onClick={onClickNewView}
          />
        </Box>
      )}

      <div className='octo-spacer' />

      <Box className='view-actions'>
        {!props.readOnly && activeView && (
          <>
            {/* Display by */}

            {withDisplayBy && (
              <ViewHeaderDisplayByMenu
                properties={activeBoard?.fields.cardProperties ?? []}
                activeView={activeView}
                dateDisplayPropertyName={dateDisplayProperty?.name}
              />
            )}

            {/* Filter */}
            <ViewFilterControl activeBoard={activeBoard} activeView={activeView} />

            {/* Sort */}
            {withSortBy && (
              <ViewSortControl
                activeBoard={activeBoard}
                activeView={activeView}
                cards={cards}
                viewSortPopup={viewSortPopup}
              />
            )}
          </>
        )}

        {/* Search - disabled until we can access page data inside the redux selector */}

        {/* <ViewHeaderSearch/> */}

        {/* Link to view embedded table in full - check that at least one view is created */}
        {props.embeddedBoardPath && !!views.length && (
          <Link href={`/${router.query.domain}/${props.embeddedBoardPath}`}>
            <Tooltip title='Open as full page' placement='top'>
              <span>
                <IconButton
                  icon={<OpenInFullIcon color='secondary' sx={{ fontSize: 14 }} />}
                  style={{ width: '32px' }}
                />
              </span>
            </Tooltip>
          </Link>
        )}

        {/* Options menu */}

        {!props.readOnly && activeView && (
          <>
            <ViewHeaderActionsMenu onClick={() => toggleViewOptions()} />

            {/* New card button */}

            {activeBoard?.fields.sourceType !== 'proposals' && (
              <NewCardButton
                addCard={props.addCard}
                addCardFromTemplate={addPageFromTemplate}
                addCardTemplate={props.addCardTemplate}
                editCardTemplate={props.editCardTemplate}
                showCard={props.showCard}
                deleteCardTemplate={deleteCardTemplate}
                boardId={viewsBoard.id}
              />
            )}
          </>
        )}
      </Box>
    </div>
  );
}

export default React.memo(ViewHeader);
