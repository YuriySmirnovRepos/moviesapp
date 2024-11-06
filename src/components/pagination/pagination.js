import React from "react";
import { Pagination as PaginationAntd } from "antd";
import "./pagination.css";

const Pagination = ({
  currentPaginationPage,
  totalElementsCount,
  onPaginationPageChanged,
}) => {

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
};

export default Pagination;
