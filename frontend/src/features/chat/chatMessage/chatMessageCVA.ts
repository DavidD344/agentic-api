import { cva } from 'class-variance-authority';

export const chatMessageCVA = cva(`py-4 px-6 w-fit max-w-[85%] font-normal md:text-[1.6rem] text-[1.4rem] font-source`, {
  variants: {
    typeMessage: {
      meMessage: 'rounded-[1.2rem] bg-B200',
      otherMessage: 'rounded-[1.2rem] bg-N200',

      //       meMessage: 'rounded-t-[1.2rem] rounded-bl-[1.2rem] bg-B200',
      // otherMessage: 'rounded-t-[1.2rem] rounded-br-[1.2rem] bg-N200',
    },
  },
});
