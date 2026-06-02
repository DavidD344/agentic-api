import type { Meta, StoryObj } from '@storybook/react';
import { AvatarIcon } from './AvatarIcon';

const meta: Meta<typeof AvatarIcon> = {
  component: AvatarIcon,
  title: 'Common/AvatarIcon',
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
type Story = StoryObj<typeof AvatarIcon>;

export const DefaultWithoutImg: Story = {
  args: {
    description: 'Imagem admin',
  },
};

export const DefaultWithImg: Story = {
  args: {
    linkImg: '/lorenaIcon.png',
    description: 'Imagem admin',
  },
};
