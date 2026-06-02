import { cva } from 'class-variance-authority';

export const buttonDefaultCVA = cva(
  `w-full gap-x-1 flex justify-center items-center px-6 h-fit rounded-full transition-all duration-300  text-[1.4rem] font-semibold font-source`,
  {
    variants: {
      variant: {
        default: 'flex-row',
        leftIcon: 'gap-x-2 flex-row-reverse',
        onlyIcon: 'gap-x-0 px-3',
        rightIcon: 'gap-x-2 flex-row ',
      },
      
      variantColor: {
        primary: 'bg-DSGlobalPrimary text-[#FFF]',
        white: 'bg-[#F5F5F5] text-DSGlobalPrimary',
        secondary: 'text-[#231111] border-[#231111] border-[0.1rem] ',
        secondaryBorderNone: 'text-[#F5F5F5] ',
        link: 'bg-GrayScale-Surface-Default text-B700',
        red: 'bg-R700 text-white',
        admin:'bg-DSGlobalPrimary',
       adminVoid:'text-DSGlobalPrimary border-DSGlobalPrimary border-[0.1rem]'
      },
      variantSize:{
        Regular :'min-h-[4rem] ',
        Huge:'min-h-[4.4rem] ',
      },
      state: {
        loading: 'cursor-default',
        active: '',
        disabled: 'opacity-50 text-[#A5ADBA]  cursor-default',
      },
    },

    compoundVariants: [
      // {
      //   variantColor: 'primary',
      //   state: 'active',
      //   className: 'hover:bg-B400',
      // },
      // {
      //   variantColor: 'secondary',
      //   state: 'active',
      //   className: 'hover:bg-GrayScale-Border-Default',
      // },
      // {
      //   variantColor: 'link',
      //   state: 'active',
      //   className: 'hover:bg-GrayScale-Border-Default',
      // },
      // {
      //   variantColor: 'white',
      //   state: 'active',
      //   className: 'hover:bg-GrayScale-Border-Default',
      // },
      // {
      //   variantColor: 'red',
      //   state: 'active',
      //   className: 'hover:bg-R600',
      // },
      // {
      //   state: ['loading', 'disabled'],
      //   className: 'cursor-default',
      // },
    ],
    defaultVariants: {
      variant: 'default',
      state: 'active',
      variantColor: 'primary',
      variantSize:'Regular'
    },
  },
);
