import React from 'react';
import './tabs.css';
import { Tabs as TabsAntd } from 'antd';
import propTypes from 'prop-types';

function Tabs({ currentTabKey, renderTabContent, onTabClick, isLoading }) {
  return (
    <TabsAntd
      onTabClick={onTabClick}
      activeKey={currentTabKey}
      tabBarStyle={{ width: 'min-content', margin: '13px auto 0 auto' }}
      style={{ width: '100%' }}
      defaultActiveKey="1"
      centered
      items={[
        {
          label: 'Search',
          key: '1',
          forceRender: true,
          children: renderTabContent,
          disabled: isLoading,
        },
        {
          label: 'Rated',
          key: '2',
          forceRender: true,
          children: renderTabContent,
          disabled: isLoading,
        },
      ]}
    />
  );
}

export default Tabs;

Tabs.propTypes = {
  currentTabKey: propTypes.string,
  renderTabContent: propTypes.node,
  onTabClick: propTypes.func,
  isLoading: propTypes.bool,
};

Tabs.defaultProps = {
  currentTabKey: '1',
  renderTabContent: null,
  onTabClick: () => null,
  isLoading: false,
};
