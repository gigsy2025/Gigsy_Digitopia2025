import type { Meta, StoryObj } from "@storybook/nextjs";

import { Page } from "./Page";

const meta: Meta<typeof Page> = {
  title: "Example/Page",
  component: Page,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Page>;

export const LoggedOut: Story = {};

export const LoggedIn: Story = {
  play: async ({ canvasElement }) => {
    const loginButton = canvasElement.querySelector('button[name="login"]');
    if (loginButton instanceof HTMLButtonElement) {
      loginButton.click();
    }
  },
};
