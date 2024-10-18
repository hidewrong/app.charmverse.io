'use client';

import { log } from '@charmverse/core/log';
import { DeleteOutlined as Delete } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Button,
  IconButton,
  Dialog,
  Tooltip,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

import { deleteRepoAction } from 'lib/repos/deleteRepoAction';

type DeleteRepoButtonProps = {
  repoId: number;
  deletedAt: string | Date | null;
  onDelete: () => void;
};

export function DeleteRepoButton({ repoId, deletedAt, onDelete }: DeleteRepoButtonProps) {
  const [open, setOpen] = useState(false);

  const { executeAsync: deleteRepo, hasErrored, isExecuting: isDeleting } = useAction(deleteRepoAction);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = async () => {
    try {
      await deleteRepo({ repoId, deleteIt: !deletedAt });
      onDelete();
      handleClose();
    } catch (error) {
      log.error('Failed to delete repo:', error);
    }
  };

  return (
    <>
      {deletedAt ? (
        <Tooltip title={deletedAt ? `Deleted on: ${new Date(deletedAt).toLocaleDateString()}` : ''}>
          <Button size='small' variant='contained' color='primary' onClick={handleClickOpen}>
            Restore
          </Button>
        </Tooltip>
      ) : (
        <IconButton size='small' color='error' onClick={handleClickOpen}>
          <Delete fontSize='small' />
        </IconButton>
      )}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>
            Are you sure you want to {deletedAt ? 'restore' : 'delete'} this repo?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant='outlined' color='secondary' onClick={handleClose}>
            Cancel
          </Button>
          <LoadingButton
            variant='contained'
            loading={isDeleting}
            onClick={handleDelete}
            color={deletedAt ? 'primary' : 'error'}
            autoFocus
          >
            {deletedAt ? 'Restore' : 'Delete'}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
