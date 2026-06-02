import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { VerificationCode } from './VerificationCode';
const meta: Meta<typeof VerificationCode> = {
  component: VerificationCode,
  title: 'Common/VerificationCode',
  decorators: [
    (story) => {
      const [code, setCode] = useState<string>('');
      const codeLength = 6;
      return (
        <div className="w-full h-screen py-5 px-3.5 flex flex-row justify-start items-start bg-DSGlobalBackgroundColor">
        <div className="max-w-[44rem]  w-full ml-10 mt-10 h-fit p-5">
          <h1 className="text-lg">
            Code: <b>{code}</b>
          </h1>
          <br />
          {story({
            args: {
              code,
              setCode,
              variant: 'default',
              codeLength,
            },
          })}
          <br />
          <br />
          <hr />
          <br />
          <br />
          {story({
            args: {
              code,
              setCode,
              variant: 'default',
              note: 'dangerous',
              message: 'Este campo é obrigatório.',
              codeLength,
            },
          })}
          <br />
          <br />
          <hr />
          <br />
          <br />
          {story({
            args: {
              code,
              setCode,
              variant: 'default',
              note: 'success',
              message: 'Validação concluida',
              codeLength,
            },
          })}
        </div>
    </div>

      );
    },
  ],
};
export default meta;
type Story = StoryObj<typeof VerificationCode>;
export const Default: Story = {};
