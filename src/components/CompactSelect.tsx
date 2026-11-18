import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';

interface Props {
  id: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
}

export function CompactSelect({ id, name, value, onChange, options }: Props) {
  return (
    <Select.Root name={name} value={value} onValueChange={onChange}>
      <Select.Trigger id={id} className="compact-select-trigger">
        <Select.Value />
        <Select.Icon>
          <ChevronDown size={13} aria-hidden="true" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="compact-select-content"
          position="popper"
          sideOffset={3}
          collisionPadding={5}
          data-wordpeek-select-open="true"
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="compact-select-item"
              >
                <Select.ItemText>{option.label}</Select.ItemText>
                <Select.ItemIndicator>
                  <Check size={12} aria-hidden="true" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
