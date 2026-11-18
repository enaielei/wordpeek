import type { ButtonHTMLAttributes } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { 'aria-label': string };
export function IconButton({ title, children, ...props }: Props) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button type="button" {...props}>
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="compact-tooltip"
          sideOffset={4}
          collisionPadding={6}
        >
          {title || props['aria-label']}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
