import SettingsIcon from "@atlaskit/icon/glyph/settings";
import type { Meta, StoryObj } from "@storybook/react";
import { ButtonDefault } from "./ButtonDefault";
import React from "react";

const meta: Meta<typeof ButtonDefault> = {
  component: ButtonDefault,
  title: "Common/ButtonDefault",
  decorators: [
    (story) => {
      return (
        <div className="w-full h-screen py-5 px-3.5 flex flex-row justify-start items-start bg-DSGlobalBackgroundColor">
          <div className="max-w-[35.6rem] w-full h-fit p-5">{story()}</div>
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof ButtonDefault>;

export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
    isLoading: false,
  },
};
export const DefaultIsLoading: Story = {
  args: {
    children: "Button",
    variant: "default",
    isLoading: true,
  },
};
export const DefaultIconRight: Story = {
  args: {
    children: "Button",
    variant: "rightIcon",
    icon: <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />,
    isLoading: false,
  },
};

export const DefaultIconLeft: Story = {
  args: {
    children: "Continuar",
    icon: (
      <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />
    ),
    variant: "leftIcon",
    isLoading: false,
  },
};
export const PrimaryIconOnly: Story = {
  args: {
    icon: <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />,
    variant: "onlyIcon",
    variantColor: "primary",
    className: "w-fit",
    isLoading: false,
  },
};
export const DefaultDisabled: Story = {
  args: {
    children: "Button",
    variant: "default",
    isLoading: false,
    disabled: true,
  },
};

export const Secondary: Story = {
  args: {
    children: "Button",
    variant: "default",
    variantColor: "secondary",
    isLoading: false,
  },
};
export const SecondaryIsLoading: Story = {
  args: {
    children: "Button",
    variant: "default",
    variantColor: "secondary",
    isLoading: true,
  },
};
export const SecondaryBorderNone: Story = {
  args: {
    children: "Button",
    variant: "default",
    variantColor: "secondaryBorderNone",
    isLoading: false,
  },
};


export const SecondaryIconRight: Story = {
  args: {
    children: "Button",
    variant: "rightIcon",
    variantColor: "secondary",
    icon: <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />,
    isLoading: false,
  },
};

export const SecondaryBorderNoneIconRight: Story = {
  args: {
    children: "Button",
    variant: "rightIcon",
    variantColor: "secondaryBorderNone",
    icon: <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />,
    isLoading: false,
  },
};
export const SecondaryIconLeft: Story = {
  args: {
    children: "Continuar",
    icon: <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />,
    variant: "leftIcon",
    variantColor: "secondary",
    isLoading: false,
  },
};
export const SecondaryBorderNoneIconLeft: Story = {
  args: {
    children: "Continuar",
    icon: <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />,
    variant: "leftIcon",
    variantColor: "secondaryBorderNone",
    isLoading: false,
  },
};
export const SecondaryIconOnly: Story = {
  args: {
    icon: <SettingsIcon primaryColor="#F5F5F5" size="medium" label="" />,
    variant: "onlyIcon",
    variantColor: "secondary",
    className: "w-fit",
    isLoading: false,
  },
};

export const SecondaryDisabled: Story = {
  args: {
    children: "Button",
    variant: "default",
    variantColor: "secondary",
    isLoading: false,
    disabled: true,
  },
};
