import type { PageMeta } from '@charmverse/core/pages';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import { fancyTrim } from 'lib/utilities/strings';

const maxTitleLength = 35;

type Props = {
  disabled?: boolean;
  options: PageMeta[];
  value: PageMeta | null;
  onChange: (value: PageMeta | null) => void;
};

export function ProposalTemplateSelect({ disabled, options, value, onChange }: Props) {
  const propertyOptions = options.map((option) => ({
    id: option.id,
    color: 'gray',
    value: fancyTrim(option.title || 'Untitled', maxTitleLength)
  }));

  const propertyValue = value?.id ?? '';

  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    const option = options.find(({ id }) => id === newValue);
    if (option === undefined) {
      onChange(null);
    } else if ('id' in option) {
      onChange(option);
    }
  }

  return (
    <TagSelect
      wrapColumn
      readOnly={disabled}
      options={propertyOptions}
      noOptionsText={
        propertyValue ? 'No more options available for this category' : 'No options available for this category'
      }
      propertyValue={propertyValue}
      onChange={onValueChange}
    />
  );
}
