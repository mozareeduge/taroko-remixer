import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@taroko/ui";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = { args: { children: "Default" } };
export const Primary: Story = { args: { children: "Primary", variant: "primary" } };
export const Danger: Story = { args: { children: "Delete", variant: "danger" } };
export const Ghost: Story = { args: { children: "Cancel", variant: "ghost" } };
export const Icon: Story = { args: { children: "▶", variant: "icon", "aria-label": "Play" } };
export const Disabled: Story = { args: { children: "Disabled", isDisabled: true } };
