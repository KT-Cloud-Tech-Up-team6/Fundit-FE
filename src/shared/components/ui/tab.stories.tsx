import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Tab, TabList } from "./tab";

const meta = {
  title: "Shared/UI/Tab",
  component: Tab,
  tags: ["autodocs"],
  parameters: { layout: "centered", nextjs: { appDirectory: true } },
  args: {
    children: "text",
    selected: true,
    size: "lg",
    variant: "primary",
  },
  argTypes: {
    size: { control: "radio", options: ["sm", "md", "lg"] },
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

/** 링크형. URL로 전환하므로 role="tab" 대신 aria-current를 쓴다. */
export const NavLinks: Story = {
  parameters: { nextjs: { appDirectory: true } },
  render: () => (
    <TabList aria-label="프로젝트 상태" layout="track" mode="nav">
      <Tab href="?status=active" selected size="sm">
        진행중 <span>2</span>
      </Tab>
      <Tab href="?status=draft" size="sm">
        준비중 <span>1</span>
      </Tab>
      <Tab href="?status=closed" size="sm">
        완료 <span>14</span>
      </Tab>
    </TabList>
  ),
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
      <TabList aria-label="상태" layout="track" mode="nav">
        <Tab href="#active" selected size="sm">
          진행중 <span>2</span>
        </Tab>
        <Tab href="#draft" size="sm">
          준비중 <span>1</span>
        </Tab>
        <Tab href="#closed" size="sm">
          완료 <span>14</span>
        </Tab>
      </TabList>
    </div>
  ),
};

/** selected와 disabled가 겹친 탭. 초기 로빙 tabindex(0)가 비활성 탭에 박히면
    포커스를 못 받아 탭리스트 전체가 키보드로 진입 불가가 된다. */
export const DisabledSelected: Story = {
  render: () => (
    <TabList aria-label="비활성 선택 탭">
      <Tab disabled selected size="lg">
        비활성
      </Tab>
      <Tab size="lg">활성</Tab>
    </TabList>
  ),
};
