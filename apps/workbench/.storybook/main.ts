import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinalConfig(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      "@taroko/core": resolve(__dirname, "../../../packages/core/src/index.ts"),
      "@taroko/schema": resolve(__dirname, "../../../packages/schema/src/index.ts"),
      "@taroko/artifact-runtime": resolve(__dirname, "../../../packages/artifact-runtime/src/index.ts"),
      "@taroko/ui": resolve(__dirname, "../../../packages/ui/src/index.ts"),
      "@taroko/fixtures": resolve(__dirname, "../../../packages/fixtures/src/index.ts"),
    };
    return config;
  },
};

export default config;
