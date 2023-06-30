import React, { Component, useState } from "react";
import { connect } from "react-redux";
import { useSelector, useDispatch } from "react-redux";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";

import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function SecuritySettings(props) {

  const cipher = useSelector((state) =>
    state.user?.cipher
  );

  const show_save_key_alert = useSelector((state) =>
    state?.user?.profile?.profile?.key_verified == false
  );

  const [open, setOpen] = useState(false);

  const copyKey = () => {
    navigator.clipboard.writeText(cipher);
    setOpen(true);
    setTimeout(() => setOpen(false), 500);
  };

  return (
    <Box className="wrapperMobile">
      { show_save_key_alert && <Container>
        <Grid container spacing={2} sx={{ marginTop: 1 }}>
          <Grid xs={12} md={12}>
            <Alert
              severity="warning"
              id="cy_migrate_alert"
            >
              <AlertTitle>You need to backup your encryption key</AlertTitle>
              A backup of your encryption key will be required to access your data if you lose your password. Without this key, all your data will be lost.
            </Alert>
          </Grid>
        </Grid>
      </Container> }

      <List>
        <ListItem
          secondaryAction={
            <Tooltip title={open ? "Copied !" : 'Copy to clipboard'}>
              <IconButton aria-label="copy" size="large" onClick={() => copyKey()}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          }>
          <ListItemText primary="Encryption key" secondary={cipher} />
        </ListItem>
      </List>

    </Box>
  );
}