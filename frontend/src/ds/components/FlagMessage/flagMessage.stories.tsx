import type { Meta, StoryObj } from "@storybook/react";
import { FlagMessage } from "./FlagMessage";

const meta: Meta<typeof FlagMessage> = {
  component: FlagMessage,
  title: "Common/FlagMessage",
  decorators: [
    (story) => {
      return <div className="max-w-[60rem] w-full h-fit p-5">{story()}</div>;
    },
  ],
};
export default meta;
type Story = StoryObj<typeof FlagMessage>;

export const Error: Story = {
  args: {
    variant: "error",
    title: "Atenção",
    children:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor",
  },
};
export const Success: Story = {
  args: {
    variant: "success",
    title: "Sucesso",
    children:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor",
  },
};

export const Info: Story = {
  args: {
    variant: "info",
    title: "Atenção",
    children:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor",
  },
};
