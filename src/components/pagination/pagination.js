import React from 'react';
import { Pagination as PaginationAntd } from 'antd';
import './pagination.css';
import propTypes from 'prop-types';

function Pagination({
  currentPaginationPage,
  totalElementsCount,
  onPaginationPageChanged,
}) {
  return (
    <PaginationAntd
      showSizeChanger={false}
      defaultCurrent={1}
      current={currentPaginationPage}
      defaultPageSize={6}
      total={totalElementsCount}
      className="pagination"
      onChange={onPaginationPageChanged}
    />
  );
}

export default Pagination;

Pagination.defaultProps = {
  currentPaginationPage: 1,
  totalElementsCount: 0,
  onPaginationPageChanged: () => {},
};

Pagination.propTypes = {
  currentPaginationPage: propTypes.number,
  totalElementsCount: propTypes.number,
  onPaginationPageChanged: propTypes.func,
};
