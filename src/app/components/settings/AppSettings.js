import React, { useEffect, useState } from "react";
import moment from "moment";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from 'react-router-dom';

import List from "@mui/material/List";
import ListSubheader from "@mui/material/ListSubheader";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";

import Switch from "@mui/material/Switch";
import Divider from "@mui/material/Divider";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExitToApp from "@mui/icons-material/ExitToApp";
import DeleteForever from "@mui/icons-material/DeleteForever";
import BugReportIcon from "@mui/icons-material/BugReport";
import ReportIcon from '@mui/icons-material/Report';

import UserActions from "../../actions/UserActions";
import AppActions from "../../actions/AppActions";
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';

import package_json from "../../../../package.json";

export default function AppSettings() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDeveloper = useSelector(state => state.app.isDeveloper);

  const toggle_developer_mode = () => {
    dispatch(AppActions.toggleDeveloperMode());
  }

  return (
    <div
      className="layout_content wrapperMobile"
      subheader={
        <ListSubheader disableSticky={true}>Authentication</ListSubheader>
      }
    >
      <List>
        <ListItem>
          <ListItemText
            primary="Version"
            secondary={package_json.version}
          />
        </ListItem>
        <Divider />
        <ListItem button onClick={() => toggle_developer_mode()}>
          <ListItemIcon>
            <DeveloperModeIcon />
          </ListItemIcon>
          <ListItemText
            primary="Enable Developer mode"
            secondary="Only use if you know what you are doing"
          />
          <ListItemSecondaryAction>
            <Switch onChange={toggle_developer_mode} checked={isDeveloper} />
          </ListItemSecondaryAction>
        </ListItem>
        <Divider />
        <ListItem button onClick={() => AppActions.reload()}>
          <ListItemIcon>
            <RefreshIcon />
          </ListItemIcon>
          <ListItemText
            primary="Force reload"
            secondary="Reload current page"
          />
        </ListItem>
        <ListItem button onClick={() => dispatch(UserActions.logout(true))}>
          <ListItemIcon>
            <ExitToApp />
          </ListItemIcon>
          <ListItemText
            primary="Force logout"
            secondary="Will ignore sync status"
          />
        </ListItem>
        <ListItem button onClick={() => dispatch(AppActions.reset()).then(() => { navigate('/')})}>
          <ListItemIcon>
            <DeleteForever />
          </ListItemIcon>
          <ListItemText
            primary="Reset the app"
            secondary="Full reset of the app on your device"
          />
        </ListItem>
      </List>
    </div>
  );
}