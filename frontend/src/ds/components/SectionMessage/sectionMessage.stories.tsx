import type { Meta, StoryObj } from '@storybook/react';
import { SectionMessage } from './SectionMessage';

const meta: Meta<typeof SectionMessage> = {
  component: SectionMessage,
  title: 'Common/SectionMessage',
  decorators: [
    (story) => {
      return <div className="max-w-[60rem] w-full h-fit p-5">{story()}</div>;
    },
  ],
};
export default meta;
type Story = StoryObj<typeof SectionMessage>;

export const Default: Story = {
  args: {
    variant: 'default',
    title: 'Title',
    children:
      'Title and actions are optional. Toggle their visibility as needed.',
  },
};

export const Confirmation: Story = {
  args: {
    variant: 'confirmation',
    title: 'Title',
    children:
      'Title and actions are optional. Toggle their visibility as needed.',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Title',
    children:
      'Title and actions are optional. Toggle their visibility as needed.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Title',
    children:
      'Title and actions are optional. Toggle their visibility as needed.',
  },
};

export const Change: Story = {
  args: {
    variant: 'change',
    title: 'Title',
    children:
      'Title and actions are optional. Toggle their visibility as needed.',
  },
};
