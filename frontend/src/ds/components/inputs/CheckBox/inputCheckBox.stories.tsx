import type { Meta, StoryObj } from '@storybook/react';
import { InputCheckBox } from './InputCheckBox';

const meta: Meta<typeof InputCheckBox> = {
  component: InputCheckBox,
  title: 'Common/InputCheckBox',
  decorators: [
    (story) => {
      return (
        <div className="flex flex-row w-full justify-center">
          <div className="max-w-[35.6rem] w-full h-fit p-5 ">{story()}</div>;
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof InputCheckBox>;

export const Default: Story = {
  args: {
    variant: 'square',
    placeholder: 'Escreva a descrição',
    disabled: false,
  },
};
export const Rounded: Story = {
  args: {
    variant: 'rounded',
    placeholder: 'Escreva a descrição',
    disabled: false,
  },
};
export const DefaultLabel: Story = {
  args: {
    placeholder: 'Escreva a descrição',
    label: 'Descrição',
    id: 'email',
    disabled: false,
  },
};
export const Disabled: Story = {
  args: {
    variant: 'square',
    placeholder: 'Escreva a descrição',

    disabled: true,
  },
};

export const Success: Story = {
  args: {
    variant: 'square',
    placeholder: 'Escreva a descrição',

    disabled: false,
    message: 'Válidação concluida',
    note: 'success',
  },
};

export const Dangerous: Story = {
  args: {
    variant: 'square',
    placeholder: 'Escreva a descrição',

    disabled: false,
    message: 'Digite um endereço de e-mail válido',
    note: 'dangerous',
  },
};
