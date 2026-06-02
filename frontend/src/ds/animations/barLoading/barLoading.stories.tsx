import type { Meta, StoryObj } from '@storybook/react';
import { BarLoading } from './BarLoading';

const meta: Meta<typeof BarLoading> = {
  component: BarLoading,
  title: 'Animations/BarLoading',
  decorators: [
    (story) => {
      return (
        <div className=" w-fit h-fit mt-10 ml-10 py-3 px-9 ">
          {story()}
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof BarLoading>;

export const Default: Story = {
  args: {
    active: true,
  },
};
