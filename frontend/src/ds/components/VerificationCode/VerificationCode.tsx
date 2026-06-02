import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import {
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  useEffect,
  useRef,
} from 'react';
import { ChildAccordion } from '../../animations/ChildAccordion/ChildAccordion';
import { NoteMessage } from '../noteMessage/NoteMessage';
import { verificationCodeCVA } from './verificationCodeCVA';

interface VerificationCodeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof verificationCodeCVA> {
  reset?: boolean;
  isLoading?: boolean;
  message?: string | undefined;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  codeLength: number;
}
const VerificationCode = ({
  reset,
  isLoading,
  setCode,
  variant,
  message,
  codeLength,
  note,
  ...restProps
}: VerificationCodeProps) => {
  const inputRefs = new Array(codeLength)
    .fill('')
    // eslint-disable-next-line react-hooks/rules-of-hooks
    .map(() => useRef<HTMLInputElement>(null));

  const allDigits = inputRefs.map((_el, index) => index);
  // Clean inputs and states
  const resetCode = () => {
    inputRefs.forEach((ref) => {
      if (ref.current) {
        ref.current.value = '';
      }
    });
    if (inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
    setCode('');
  };

  // Listen for external reset toggle
  useEffect(() => {
    resetCode();
  }, [reset]); //eslint-disable-line

  // Select the contents on focus
  function handleFocus(e: FocusEvent<HTMLInputElement>) {
    e.target.focus();
  }
  // Handle input
  function handleInput(e: React.ChangeEvent<HTMLInputElement>, index: number) {
    const input = e.target as HTMLInputElement;
    // Filter specials caracteres
    if (!/[a-zA-Z0-9]/.test(input.value)) {
      input.value = '';
      return;
    }
    // Convert lowercase letters to uppercase
    if (/^[a-z]+$/.test(input.value)) {
      inputRefs[index].current!.value = input.value.toUpperCase();
    }
    setCode(refrehStateByRefs());
    // verify next input
    if (index >= allDigits.length - 1) {
      return;
    }
    const nextInput = inputRefs[index + 1];
    if (nextInput.current) {
      nextInput.current.focus();
    }
  }

  // Handle backspace key
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    const input = e.target as HTMLInputElement;

    // backspace and delete press
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (input.value === '') {
        const previousInput = inputRefs[index - 1];
        if (previousInput !== undefined && previousInput !== null) {
          const previousInputCurrent =
            previousInput.current as HTMLInputElement;
          previousInputCurrent.value = '';
          previousInputCurrent.focus();
        }
        input.value = '';
      } else {
        input.value = '';
      }
    }

    if (e.key === 'ArrowLeft') {
      const previousInput = inputRefs[index - 1];
      if (previousInput !== undefined && previousInput !== null) {
        const previousInputCurrent = previousInput.current as HTMLInputElement;
        previousInputCurrent.focus();
      }
    }
    if (e.key === 'ArrowRight') {
      const nextInput = inputRefs[index + 1];
      if (nextInput !== undefined && nextInput !== null) {
        const nextInputCurrent = nextInput.current as HTMLInputElement;
        nextInputCurrent.focus();
      }
    }
    if (/[a-zA-Z0-9]/.test(e.key) && e.key.length === 1) {
      input.value = '';
    }
    setCode(refrehStateByRefs());
  }

  // Capture pasted characters
  // çAÁ*#@a
  // 1AÁ*#1a
  // 123456

  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    const pastedCode = e.clipboardData.getData('text').toUpperCase();

    if (pastedCode.length === allDigits.length) {
      inputRefs.forEach((inputRef, index) => {
        if (inputRef.current) {
          inputRef.current.value = pastedCode.charAt(index);
        }
      });
      inputRefs[allDigits.length - 1].current?.focus();
      setCode(pastedCode);
    }
  };

  const refrehStateByRefs = () => {
    let stringConcatenada = '';
    inputRefs.forEach((ref) => {
      if (ref.current) {
        stringConcatenada += ref.current.value;
      }
    });
    return stringConcatenada;
  };

  return (
    <div {...restProps} className="flex flex-col h-fit">
      <div className="flex gap-4 w-full justify-between">
        {allDigits.map((index) => (
          <input
            className={cn(
              verificationCodeCVA({
                variant,
                note,
              }),
            )}
            key={index}
            type="text"
            maxLength={1}
            onChange={(e) => handleInput(e, index)}
            ref={inputRefs[index]}
            autoFocus={index === 0}
            onFocus={handleFocus}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={isLoading}
          />
        ))}
      </div>
      <ChildAccordion active={!!message}>
        <NoteMessage variant={note}>{message}</NoteMessage>
      </ChildAccordion>
    </div>
  );
};

export { VerificationCode };
