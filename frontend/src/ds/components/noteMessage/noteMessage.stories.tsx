import type { Meta, StoryObj } from '@storybook/react';
import { NoteMessage } from './NoteMessage';

const meta: Meta<typeof NoteMessage> = {
  component: NoteMessage,
  title: 'Common/NoteMessage',
  decorators: [
    (story) => {
      return <div className="max-w-[35.6rem]  w-full h-fit p-5">{story()}</div>;
    },
  ],
};
export default meta;
type Story = StoryObj<typeof NoteMessage>;

export const NoteSuccess: Story = {
  args: {
    children: 'Note Success',
    variant: 'success',
  },
};

export const NoteDangerous: Story = {
  args: {
    children: 'Note Dangerous',
    variant: 'dangerous',
  },
};
