import type { Meta, StoryObj } from '@storybook/react';
import { ScreenLoading } from './ScreenLoading';
import React from 'react';

const meta: Meta<typeof ScreenLoading> = {
  component: ScreenLoading,
  title: 'Animations/ScreenLoading',
  decorators: [
    (story) => {
      return (
        <div className=" h-fit mt-10 ml-10 py-3 px-9">
          {story()}
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof ScreenLoading>;

export const Default: Story = {
  args: {
    active: true,
  },
};
