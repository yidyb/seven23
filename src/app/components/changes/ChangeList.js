import "./ChangeList.scss";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";

import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import IconButton from "@mui/material/IconButton";

import Divider from "@mui/material/Divider";

import MoreVertIcon from "@mui/icons-material/MoreVert";

import TrendingDown from "@mui/icons-material/TrendingDown";
import TrendingUp from "@mui/icons-material/TrendingUp";
import TrendingFlat from "@mui/icons-material/TrendingFlat";

import Icon from "@mui/material/Icon";
import Button from "@mui/material/Button";

import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import { Amount } from "../currency/Amount";
import { stringToDate } from "../../utils/date";

const CSS_ICON = {
  fontSize: "20px",
};

function sortChanges(a, b) {
  if (a.date > b.date) {
    return -1;
  } else if (a.date < b.date) {
    return 1;
  } else if (a.name > b.name) {
    return -1;
  } else if (a.id < b.id) {
    return 1;
  } else if (a.id > b.id) {
    return -1;
  }
  return 1;
}

const ELEMENT_PER_PAGE = 20;

export default function ChangeList(props) {

  const selectedCurrency = useSelector((state) => {
    return state.currencies.find((c) => c.id == state.account.currency);
  });

  const [change, setChange] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState(ELEMENT_PER_PAGE);

  const _closeActionMenu = () => {
    setAnchorEl(null);
  };

  return (
    <div className="changes_list">
      {props.changes && !isLoading
        ? props.changes
            .sort(sortChanges)
            .filter((item, index) => {
              return !pagination || index < pagination;
            })
            .map((obj) => {
              return (
                <div key={obj.id} className="changes_change">
                  <div className="changes_change_data">
                    <div className="date">
                      {moment(stringToDate(obj.date)).format("DD MMM YY")}
                      <br />

                      {obj.trend === "up" ? <TrendingDown /> : ""}
                      {obj.trend === "down" ? <TrendingUp /> : ""}
                      {obj.trend === "flat" ? <TrendingFlat /> : ""}
                    </div>
                    <div className="description">
                      <strong>{obj.name}</strong>
                      <br />
                      <small>
                        {props.currency &&
                        obj.local_currency.id == props.currency.id ? (
                          <Amount
                            value={obj.local_amount}
                            currency={obj.local_currency}
                          />
                        ) : (
                          <Amount
                            value={obj.new_amount}
                            currency={obj.new_currency}
                          />
                        )}
                        &nbsp;
                        <Icon style={{ verticalAlign: "bottom" }}>
                          <SwapHorizIcon
                            sx={CSS_ICON}
                            fontSize="small"
                          />
                        </Icon>
                        &nbsp;
                        {props.currency &&
                        obj.local_currency.id == props.currency.id ? (
                          <Amount
                            value={obj.new_amount}
                            currency={obj.new_currency}
                          />
                        ) : (
                          <Amount
                            value={obj.local_amount}
                            currency={obj.local_currency}
                          />
                        )}
                      </small>
                      <div className="convertion">
                        <div>
                          <Amount value={1} currency={selectedCurrency} /> ={" "}
                          <Amount
                            value={obj.rate}
                            currency={props.currency}
                            accurate={obj.accurate}
                          />
                        </div>
                        <div>
                          <Amount value={1} currency={props.currency} /> ={" "}
                          <Amount
                            value={obj.rate ? 1 / obj.rate : null}
                            currency={selectedCurrency}
                            accurate={obj.accurate}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="changes_change_actions">
                    <IconButton
                      onClick={(event) => {
                        setChange(obj);
                        setAnchorEl(event.currentTarget);
                      }}
                      size="large">
                      <MoreVertIcon />
                    </IconButton>
                  </div>
                </div>
              );
            })
        : ["w120", "w150", "w120", "w120", "w120", "w150", "w120", "w120"].map(
            (value, i) => {
              return (
                <div key={i} className="changes_change">
                  <div className="changes_change_data">
                    <div className="date">
                      <span className="loading w50" />
                    </div>
                    <div className="description">
                      <strong>
                        <span className={`loading ${value}`} />
                      </strong>
                      <br />
                      <small>
                        <span className="loading w30" />
                        &nbsp;
                        <Icon style={{ verticalAlign: "bottom", opacity: 0.5 }}>
                          <SwapHorizIcon sx={CSS_ICON} />
                        </Icon>
                        &nbsp;
                        <span className="loading w30" />
                      </small>
                      <div className="convertion">
                        <div>
                          <span className="loading w20" /> ={" "}
                          <span className="loading w20" />
                        </div>
                        <div>
                          <span className="loading w20" /> ={" "}
                          <span className="loading w20" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="changes_change_actions">
                    <IconButton disabled size="large">
                      <MoreVertIcon />
                    </IconButton>
                  </div>
                </div>
              );
            }
          )}
      {props.changes && pagination < props.changes.length && !isLoading ? (
        <Button
          onClick={() => setPagination(pagination + ELEMENT_PER_PAGE)}
          className="more"
        >
          More
        </Button>
      ) : (
        ""
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={_closeActionMenu}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl();
            props.onEditChange(change);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl();
            props.onDuplicateChange(change);
          }}
        >
          Duplicate
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl();
            props.onDeleteChange(change);
          }}
        >
          Delete
        </MenuItem>
      </Menu>
    </div>
  );
}