import type { Meta, StoryObj } from '@storybook/react';
import { Spin } from './Spin';

const meta: Meta<typeof Spin> = {
  component: Spin,
  title: 'Animations/Spin',
  decorators: [
    (story) => {
      return (
        <div className=" w-fit h-fit mt-10 ml-10 py-3 px-9 bg-[#000000]">
          {story()}
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof Spin>;

export const Default: Story = {
  args: {
    active: true,
  },
};
