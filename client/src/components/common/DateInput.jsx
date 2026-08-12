import { forwardRef, useRef } from "react";

const openNativePicker = (input) => {
  if (!input || typeof input.showPicker !== "function") return;

  try {
    input.showPicker();
  } catch {
    // Some browsers only allow showPicker from a direct user gesture.
  }
};

const DateInput = forwardRef(function DateInput(
  { className = "", onClick, onFocus, ...props },
  ref
) {
  const inputRef = useRef(null);

  const setRef = (node) => {
    inputRef.current = node;

    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <input
      ref={setRef}
      type="date"
      className={`cursor-pointer date-input ${className}`}
      onClick={(event) => {
        onClick?.(event);
        openNativePicker(inputRef.current);
      }}
      onFocus={(event) => {
        onFocus?.(event);
        openNativePicker(inputRef.current);
      }}
      {...props}
    />
  );
});

export default DateInput;
