import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tab, TabList } from "./tab";

const meta = {
  title: "Shared/UI/Tab",
  component: Tab,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: {
    children: "text",
    selected: true,
    size: "lg",
    variant: "primary",
  },
  argTypes: {
    size: { control: "radio", options: ["md", "lg"] },
    variant: { control: "radio", options: ["primary", "primaryLive"] },
  },
} satisfies Meta<typeof Tab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const PrimaryLive: Story = {
  args: { variant: "primaryLive" },
};

export const Inactive: Story = {
  args: { selected: false },
};

export const Gallery: Story = {
  render: (args) => (
    <div className="flex flex-col gap-9">
      {(["lg", "md"] as const).map((size) => (
        <div className="flex items-center gap-5" key={size}>
          <Tab {...args} selected size={size} variant="primary" />
          <Tab {...args} selected size={size} variant="primaryLive" />
          <Tab {...args} selected={false} size={size} />
        </div>
      ))}
      <TabList>
        <Tab selected size="lg">
          text
        </Tab>
        <Tab size="lg">text</Tab>
      </TabList>
      <TabList>
        <Tab selected size="md" variant="primaryLive">
          text
        </Tab>
        <Tab size="md">text</Tab>
        <Tab size="md">text</Tab>
      </TabList>
    </div>
  ),
};
