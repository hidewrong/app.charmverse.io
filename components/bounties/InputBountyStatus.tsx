import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { BountyStatus } from '@prisma/client';
import { BountyStatusChip } from 'components/bounties/BountyStatusBadge';
import { useEffect, useState } from 'react';

/**
 * @renderSelected Show selected options in the options menu. Default is true.
 */
interface Props {
  renderSelectedInOption?: boolean
  renderSelectedInValue?: boolean
  onChange: (value: any) => void
  defaultValues?: BountyStatus []
}

const bountyFilterOptions = Object.keys(BountyStatus) as BountyStatus[];

export default function InputBountyStatus ({ onChange, defaultValues = [], renderSelectedInValue = true, renderSelectedInOption = true }: Props) {

  const [selectedChoices, setSelectedChoices] = useState<BountyStatus[]>(defaultValues);

  useEffect(() => {
    if (defaultValues) {
      setSelectedChoices(defaultValues);
    }
  }, [defaultValues]);

  function isSelected (status: BountyStatus): boolean {
    return selectedChoices.findIndex(choice => choice === status) > -1;
  }

  function selectOption (ev: SelectChangeEvent) {

    ev.preventDefault();

    const selected = ev?.target?.value as any ?? [];

    setSelectedChoices(selected);

    onChange(selected);

  }

  return (
    <Grid container direction='row' alignItems='center'>
      <Grid item xs={12}>
        <Select
          multiple
          value={selectedChoices as any}
          onChange={selectOption}
          displayEmpty={true}
          renderValue={(selectedValues: any) => (

            (renderSelectedInValue === false || !selectedValues || selectedValues.length === 0) ? (
              'Select status'
            ) : (
              <Box display='flex'>
                {
                    (selectedValues as any[])?.map(val => {
                      return (
                        <MenuItem sx={{ p: 0, pr: 0.2 }} key={val} value={val}>
                          <BountyStatusChip status={val as BountyStatus} />
                        </MenuItem>
                      );
                    })
                  }
              </Box>
            )

          )}
        >
          {
              bountyFilterOptions.map((option) => {

                return (
                  // Component manages display
                  renderSelectedInOption
                  // External component manages display, so we hide selected options
                  || (!renderSelectedInOption && !isSelected(option)) ? (
                    <MenuItem key={option} value={option}>
                      <BountyStatusChip status={option} />
                    </MenuItem>
                    ) : null);
              })
            }
        </Select>
      </Grid>
    </Grid>
  );
}

