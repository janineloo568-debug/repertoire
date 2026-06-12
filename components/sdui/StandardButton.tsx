import {
  type ButtonHTMLAttributes,
  type ReactElement,
  type ReactNode,
  forwardRef,
  isValidElement,
  cloneElement,
} from "react";
import "./StandardButton.css";

export type StandardButtonSize = "small" | "medium" | "large";
export type StandardButtonType = "primary" | "secondary" | "tertiary";
export type StandardButtonVisualState =
  | "default"
  | "hover"
  | "focus"
  | "press"
  | "loading"
  | "disabled";

export interface StandardButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  children: ReactNode;
  size?: StandardButtonSize;
  buttonType?: StandardButtonType;
  fullWidth?: boolean;
  loading?: boolean;
  iconLeft?: ReactNode | null;
  iconRight?: ReactNode | null;
  /** Forces a visual state for Storybook / design QA. */
  visualState?: StandardButtonVisualState;
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

const SpinnerIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

function withIconColor(icon: ReactNode, colorClass: string): ReactNode {
  if (!isValidElement(icon)) return icon;
  const element = icon as ReactElement<{ className?: string }>;
  return cloneElement(element, {
    className: [colorClass, element.props.className]
      .filter(Boolean)
      .join(" "),
  });
}

export const StandardButton = forwardRef<HTMLButtonElement, StandardButtonProps>(
  function StandardButton(
    {
      children,
      size = "medium",
      buttonType = "primary",
      fullWidth = false,
      loading = false,
      disabled = false,
      iconLeft,
      iconRight,
      visualState,
      className,
      ...rest
    },
    ref,
  ) {
    const isDisabled = disabled || loading;
    const resolvedVisualState: StandardButtonVisualState = loading
      ? "loading"
      : disabled
        ? "disabled"
        : (visualState ?? "default");

    const showLeftIcon =
      iconLeft !== null &&
      (iconLeft !== undefined || buttonType === "tertiary" || loading);
    const showRightIcon = iconRight !== null && iconRight !== undefined;

    const leftIconContent = loading
      ? <SpinnerIcon className="animate-spin" />
      : (iconLeft ?? (buttonType === "tertiary" ? <CheckIcon /> : null));

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        data-size={size}
        data-type={buttonType}
        data-state={resolvedVisualState}
        className={[
          "standard-button",
          fullWidth && "standard-button--full-width",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...rest}
      >
        <span className="standard-button__interior">
          {showLeftIcon && leftIconContent && (
            <span className="standard-button__icon standard-button__icon--left">
              {withIconColor(leftIconContent, "standard-button__icon-svg")}
            </span>
          )}
          <span className="standard-button__label">{children}</span>
          {showRightIcon && iconRight && (
            <span className="standard-button__icon standard-button__icon--right">
              {withIconColor(iconRight, "standard-button__icon-svg")}
            </span>
          )}
        </span>
      </button>
    );
  },
);

StandardButton.displayName = "StandardButton";

export { CheckIcon, ChevronRightIcon, SpinnerIcon };
