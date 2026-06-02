import type { Meta, StoryObj } from '@storybook/react';
import { DropdownRoot } from './DropdownRoot';
import { DropdownElement } from '../Element/DropdownElement';
import { ButtonDefault } from '../../buttons/Default/ButtonDefault';
const meta: Meta<typeof DropdownRoot> = {
  component: DropdownRoot,
  title: 'Common/DropdownRoot',
  decorators: [
    (story) => {
      return (
        <div className="max-w-[35.6rem] w-full  ml-19 p-5 flex flex-col h-screen">
          {story()}
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof DropdownRoot>;

export const Default: Story = {
  args: {
    children: (
      <>
        <DropdownElement className="text-sm">Editar</DropdownElement>
        <DropdownElement className="text-sm">Apagar</DropdownElement>
      </>
    ),
    buttonDrop: (
      <ButtonDefault
        type="button"
        className="w-fit"
        id="menu-button"
        variant={'rightIcon'}
        aria-expanded="true"
        icon={<div/>}
        aria-haspopup="true"
      >
        Options
      </ButtonDefault>
    ),
  },
};
