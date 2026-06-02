import type { Meta, StoryObj } from '@storybook/react';
import { Textarea } from './Textarea';

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  title: 'Common/Textarea',
  decorators: [
    (story) => {
      return (
        <div className="w-full h-screen py-5 px-3.5 flex flex-row justify-start items-start bg-DSGlobalBackgroundColor">
        <div className="max-w-[35.6rem] w-full h-fit p-5">{story()}</div>;
      </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    variant: 'default',
    placeholder: 'Escreva a descrição',
    type: 'text',
    disabled: false,
    className: 'h-12',
  },
};
export const DefaultLabel: Story = {
  args: {
    variant: 'default',
    placeholder: 'Escreva a descrição',
    label: 'Descrição',
    id: 'email',
    type: 'text',
    disabled: false,
  },
};
export const Disabled: Story = {
  args: {
    variant: 'default',
    placeholder: 'Escreva a descrição',
    type: 'text',
    disabled: true,
  },
};

export const Success: Story = {
  args: {
    variant: 'default',
    placeholder: 'Escreva a descrição',
    type: 'text',
    disabled: false,
    message: 'Válidação concluida',
    note: 'success',
  },
};

export const Dangerous: Story = {
  args: {
    variant: 'default',
    placeholder: 'Escreva a descrição',
    type: 'text',
    disabled: false,
    message: 'Digite um endereço de e-mail válido',
    note: 'dangerous',
  },
};
