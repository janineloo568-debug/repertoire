import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
  StandardButton,
  type StandardButtonSize,
  type StandardButtonType,
  type StandardButtonVisualState,
  CheckIcon,
  ChevronRightIcon,
} from "../components/sdui/StandardButton";

const meta = {
  title: "SDUI/Standard Button",
  component: StandardButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "SDUI Standard Button — three sizes, three emphasis levels, six interaction states.",
      },
    },
  },
  argTypes: {
    children: { control: "text" },
    size: {
      control: "select",
      options: ["small", "medium", "large"] satisfies StandardButtonSize[],
    },
    buttonType: {
      name: "Type",
      control: "select",
      options: ["primary", "secondary", "tertiary"] satisfies StandardButtonType[],
    },
    fullWidth: { control: "boolean" },
    loading: { control: "boolean" },
    disabled: { control: "boolean" },
    iconLeft: { control: false },
    iconRight: { control: false },
    visualState: {
      control: "select",
      options: [
        "default",
        "hover",
        "focus",
        "press",
        "loading",
        "disabled",
      ] satisfies StandardButtonVisualState[],
    },
  },
  args: {
    children: "button text",
    size: "medium",
    buttonType: "primary",
    fullWidth: false,
    loading: false,
    disabled: false,
    iconLeft: <CheckIcon />,
    iconRight: <ChevronRightIcon />,
    onClick: fn(),
  },
} satisfies Meta<typeof StandardButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const SizeSmall: Story = { args: { size: "small" } };
export const SizeMedium: Story = { args: { size: "medium" } };
export const SizeLarge: Story = { args: { size: "large" } };

export const TypePrimary: Story = { args: { buttonType: "primary" } };
export const TypeSecondary: Story = { args: { buttonType: "secondary" } };
export const TypeTertiary: Story = {
  args: {
    buttonType: "tertiary",
    iconLeft: <CheckIcon />,
    iconRight: null,
  },
};

export const StateDefault: Story = { args: { visualState: "default" } };
export const StateHover: Story = { args: { visualState: "hover" } };
export const StateFocus: Story = { args: { visualState: "focus" } };
export const StatePress: Story = { args: { visualState: "press" } };
export const StateLoading: Story = { args: { loading: true } };
export const StateDisabled: Story = { args: { disabled: true } };

export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ width: "320px" }}>
        <Story />
      </div>
    ),
  ],
};
