import type { Meta, StoryObj } from '@storybook/react';
import { TabDefault } from './TabDefault';
import SettingsIcon from '@atlaskit/icon/glyph/settings';
const meta: Meta<typeof TabDefault> = {
  component: TabDefault,
  title: 'Common/TabDefault',
  decorators: [
    (story) => {
      return (
        <>
        <div className="max-w-[104rem] pt-9 px-3.5 w-full h-full flex flex-row justify-start items-start bg-[#E7E7E7]">
          {story()}
          <TabDefault
            active={true}
            variantColor={'white'}
            icon={
              <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />
            }
          >
            Participantes
          </TabDefault>
          <TabDefault
            active={true}
            icon={
              <SettingsIcon primaryColor="#8F6ABF" size="medium" label="" />
            }
          >
            Participantes
          </TabDefault>
          <TabDefault
            active={false}
            icon={
              <SettingsIcon primaryColor="#8F6ABF" size="medium" label="" />
            }
          >
            Configurações
          </TabDefault>
        </div>
        <div className="max-w-[104rem] py-5 px-3.5 w-full h-full flex flex-row justify-start items-start bg-DSGlobalBackgroundColor">
          {story()}
          <TabDefault
            active={true}
            variantColor={'white'}
            icon={
              <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />
            }
          >
            Participantes
          </TabDefault>
          <TabDefault
            active={true}
            icon={
              <SettingsIcon primaryColor="#8F6ABF" size="medium" label="" />
            }
          >
            Participantes
          </TabDefault>
          <TabDefault
            active={false}
            icon={
              <SettingsIcon primaryColor="#8F6ABF" size="medium" label="" />
            }
          >
            Configurações
          </TabDefault>
        </div>
        </>

      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof TabDefault>;

export const Default: Story = {
  args: {
    children: 'Geral',
  },
};
