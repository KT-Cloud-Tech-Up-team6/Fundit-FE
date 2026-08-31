import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card, CardGrid, CardHorizontal, CardList, DividerList, ListItem } from "./card";

const meta = {
  title: "Shared/UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="bg-[var(--charcoal-900)] p-4">
        <Story />
      </div>
    ),
  ],
  args: {
    size: "lg",
  },
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-5">
      <Card size="lg" />
      <Card size="md" />
      <Card size="sm" />
    </div>
  ),
};

export const Grids: Story = {
  render: () => (
    <div className="flex flex-col gap-9">
      <CardGrid columns={2}>
        <Card size="md" />
        <Card size="md" />
      </CardGrid>
      <CardGrid columns={3}>
        <Card size="sm" />
        <Card size="sm" />
        <Card size="sm" />
      </CardGrid>
    </div>
  ),
};

export const HorizontalList: Story = {
  render: () => (
    <CardList>
      <CardHorizontal />
      <CardHorizontal />
      <CardHorizontal />
    </CardList>
  ),
};

export const WithDividers: Story = {
  render: () => (
    <DividerList>
      <ListItem />
      <ListItem />
      <ListItem />
    </DividerList>
  ),
};

export const Gallery: Story = {
  render: () => (
    <div className="flex flex-col gap-9">
      <div className="flex items-end gap-5">
        <Card size="lg" />
        <Card size="md" />
        <Card size="sm" />
      </div>
      <CardGrid columns={2}>
        <Card size="md" />
        <Card size="md" />
      </CardGrid>
      <CardGrid columns={3}>
        <Card size="sm" />
        <Card size="sm" />
        <Card size="sm" />
      </CardGrid>
      <CardList>
        <CardHorizontal />
        <CardHorizontal />
        <CardHorizontal />
      </CardList>
      <DividerList>
        <ListItem />
        <ListItem />
        <ListItem />
      </DividerList>
    </div>
  ),
};
