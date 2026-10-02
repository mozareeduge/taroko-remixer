import type { Meta, StoryObj } from "@storybook/react";
import { StatusLamp } from "@taroko/ui";

const meta: Meta<typeof StatusLamp> = {
  title: "UI/StatusLamp",
  component: StatusLamp,
  tags: ["autodocs"],
};
export default meta;
type Story = StoryObj<typeof StatusLamp>;

export const Off: Story = { args: { state: "off", label: "saved" } };
export const Active: Story = { args: { state: "active", label: "running" } };
export const Warn: Story = { args: { state: "warn", label: "unsaved" } };
export const Danger: Story = { args: { state: "danger", label: "error" } };
export const Stale: Story = { args: { state: "stale", label: "stale" } };
