import type { Meta, StoryObj } from '@storybook/react';
import { StrongPassword } from './StrongPassword';

const meta: Meta<typeof StrongPassword> = {
  component: StrongPassword,
  title: 'Common/StrongPassword',
  decorators: [
    (story) => {
      return (
        <div className="max-w-[24rem] ml-16 mt-16 w-full h-fit p-5">
          {story()}
        </div>
      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof StrongPassword>;
const barsAndTextStrongPassword: { num: number; message: string }[] = [
  {
    num: 1,
    message: 'Fraca',
  },
  {
    num: 2,
    message: 'Razoável',
  },
  {
    num: 3,
    message: 'Boa',
  },
  {
    num: 4,
    message: 'Forte',
  },

];
export const StrongPasswordNotFocus: Story = {
  args: {
    bars: barsAndTextStrongPassword,
    messageMinimalLength: 'A senha deve ter pelo menos 8 caracteres',
  },
};
export const StrongPasswordVazio: Story = {
  args: {
    bars: barsAndTextStrongPassword,
    messageMinimalLength: 'A senha deve ter pelo menos 8 caracteres',
    step: 0,
  },
};

export const StrongPasswordFraco: Story = {
  args: {
    bars: barsAndTextStrongPassword,
    messageMinimalLength: 'A senha deve ter pelo menos 8 caracteres',
    step: 1,
  },
};

export const StrongPasswordRazoavel: Story = {
  args: {
    bars: barsAndTextStrongPassword,
    messageMinimalLength: 'A senha deve ter pelo menos 8 caracteres',
    step: 2,
  },
};

export const StrongPasswordBoa: Story = {
  args: {
    bars: barsAndTextStrongPassword,
    messageMinimalLength: 'A senha deve ter pelo menos 8 caracteres',
    step: 3,
  },
};

export const StrongPasswordForte: Story = {
  args: {
    bars: barsAndTextStrongPassword,
    messageMinimalLength: 'A senha deve ter pelo menos 8 caracteres',
    step: 4,
  },
};

// export const StrongPasswordMuitoForte: Story = {
//   args: {
//     bars: barsAndTextStrongPassword,
//     messageMinimalLength: 'A senha deve ter pelo menos 8 caracteres',
//     step: 5,
//   },
// };
