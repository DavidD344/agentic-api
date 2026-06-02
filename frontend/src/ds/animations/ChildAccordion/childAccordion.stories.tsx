import type { Meta, StoryObj } from '@storybook/react';
import { ChildAccordion } from './ChildAccordion';

const meta: Meta<typeof ChildAccordion> = {
  component: ChildAccordion,
  title: 'Animations/ChildAccordion',
  decorators: [
    (story) => {
      return (
        <div className="max-w-[35.6rem] border-2 w-full h-fit p-5">
          {story()}
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof ChildAccordion>;

export const Default: Story = {
  args: {
    active: true,
    children: <div>dsasd</div>,
  },
};
