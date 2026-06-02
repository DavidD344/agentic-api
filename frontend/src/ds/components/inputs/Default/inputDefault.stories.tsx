import type { Meta, StoryObj } from "@storybook/react";
import { InputDefault } from "./InputDefault";
import SearchIcon from "@atlaskit/icon/glyph/search";

const meta: Meta<typeof InputDefault> = {
  component: InputDefault,
  title: "Common/InputDefault",
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
type Story = StoryObj<typeof InputDefault>;

export const Default: Story = {
  args: {
    variant: "default",
    placeholder: "Insira seu e-mail",
    type: "text",
    disabled: false,
  },
};
export const DefaultLabel: Story = {
  args: {
    variant: "default",
    placeholder: "Insira seu e-mail",
    label: "Email",
    id: "email",
    type: "text",
    disabled: false,
  },
};
export const Disabled: Story = {
  args: {
    variant: "default",
    placeholder: "Insira seu e-mail",
    type: "text",
    disabled: true,
  },
};

export const Success: Story = {
  args: {
    variant: "default",
    placeholder: "Insira seu e-mail",
    type: "text",
    disabled: false,
    message: "Válidação concluida",
    note: "success",
  },
};

export const Dangerous: Story = {
  args: {
    variant: "default",
    placeholder: "Insira seu e-mail",
    type: "text",
    disabled: false,
    message: "Campo obrigatório",
    note: "dangerous",
  },
};

export const rightIcon: Story = {
  args: {
    variant: "right",
    placeholder: "Insira seu e-mail",
    type: "text",
    disabled: false,
    rightIcon: (
      <div
        className="cursor-pointer bg-R300"
        onClick={() => {
          console.log("Clicado Icon");
        }}
      >
        <SearchIcon label="" primaryColor={"#F5F5F5"} size="medium" />
      </div>
    ),
  },
};

export const leftIcon: Story = {
  args: {
    variant: "left",
    placeholder: "Insira seu e-mail",
    type: "text",
    disabled: false,
    leftIcon: (
      <div
        className="cursor-pointer bg-R300"
        onClick={() => {
          console.log("Clicado Icon");
        }}
      >
        <SearchIcon label="" primaryColor={"#F5F5F5"} size="medium" />
      </div>
    ),
  },
};

export const twoSidesIcon: Story = {
  args: {
    variant: "twoSidesIcon",
    placeholder: "Insira seu e-mail",
    type: "text",
    disabled: false,
    rightIcon: (
      <div
        onClick={() => {
          console.log("Clicado Icon");
        }}
      >
        <SearchIcon label="" primaryColor={"#F5F5F5"} size="medium" />
      </div>
    ),
    leftIcon: (
      <div
        onClick={() => {
          console.log("Clicado Icon");
        }}
      >
        <SearchIcon label="" primaryColor={"#F5F5F5"} size="medium" />
      </div>
    ),
  },
};
