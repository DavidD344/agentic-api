import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';
import { ButtonDefault } from '../buttons/Default/ButtonDefault';

const meta: Meta<typeof EmptyState> = {
  component: EmptyState,
  title: 'Common/EmptyState',
  decorators: [
    (story) => {
      return (
        <div className=" w-full h-fit flex flex-col justify-start items-center p-4 pt-16">
          {story()}
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: 'Nenhum estabelecimento encontrado',
    message: 'Pesquise outra região',
    linkImg: '',
    children: (
      <ButtonDefault
        variant={'default'}
        variantColor={'primary'}
        className="w-fit"
      >
        Pesquisar
      </ButtonDefault>
    ),
  },
};
