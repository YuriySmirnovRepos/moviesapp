import React from "react";
import "./tabs.css";
import { Tabs as TabsAntd } from "antd";

const Tabs = ({ currentTabKey, renderTabContent, onTabClick, isLoading }) => {
  return (
    <TabsAntd
      onTabClick={onTabClick}
      activeKey={currentTabKey}
      tabBarStyle={{ width: "min-content", margin: "19px auto" }}
      style={{ width: "100%" }}
      defaultActiveKey="1" centered items=
      {[
        {
          label: "Search",
          key: "1",
          forceRender: true,
          children: renderTabContent,
          disabled: isLoading
        },
        {
          label: "Rated",
          key: "2",
          forceRender: true,
          children: renderTabContent,
          disabled: isLoading
        },
      ]}
    />
  );
};

export default Tabs;
