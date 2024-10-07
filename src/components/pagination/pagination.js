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
      style={{ justifyContent: "center",marginTop: "36px" }}
      onChange={onPaginationPageChanged}
    />
  );
};

export default Pagination;
