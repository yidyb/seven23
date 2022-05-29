import "./SocialNetworksSettings.scss";

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import makeStyles from '@mui/styles/makeStyles';

import Avatar from "@mui/material/Avatar";

import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";

import MapIcon from "@mui/icons-material/Map";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import NomadlistForm from "../settings/socialnetworks/NomadlistForm";

import Button from "@mui/material/Button";

import UserActions from "../../actions/UserActions";
import AppActions from "../../actions/AppActions";

const useStyles = makeStyles((theme) => ({
  container: {
    padding: "10px 20px 40px 20px",
    fontSize: "0.9rem",
  },
  cards: {
    maxWidth: 400,
  },
  nomadlist: {
    backgroundColor: theme.palette.brand.nomadlist,
  },
  rightIcon: {
    fontSize: 16,
    marginLeft: theme.spacing(1),
  },
}));

export default function SocialNetworksSettings(props) {
  const classes = useStyles();
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.app.theme);
  const isConfidential = useSelector((state) => state.app.isConfidential);
  const nomadlist = useSelector((state) =>
    state.user.socialNetworks ? state.user.socialNetworks.nomadlist : null
  );

  const _switchTheme = () => {
    dispatch(UserActions.setTheme(theme === "dark" ? "light" : "dark"));
  };

  const _switchVisibility = () => {
    dispatch(AppActions.setConfidential(!isConfidential));
  };

  const _openNomadlist = () => {
    props.onModal(
      <NomadlistForm
        onSubmit={() => props.onModal()}
        onClose={() => props.onModal()}
      />
    );
  };
  const _removeNomadlist = () => {
    dispatch(UserActions.updateNomadlist(null));
  };

  return (
    <div className="layout_content wrapperMobile">
      <div className={classes.container}>
        <h2>Social networks</h2>
        <p>Connect your different accounts to enhance your data.</p>

        <div>
          <Card className={classes.cards}>
            <CardHeader
              avatar={
                <Avatar aria-label="nomadlist" className={classes.nomadlist}>
                  <MapIcon />
                </Avatar>
              }
              title="Nomadlist"
              subheader="Access your public data to match your expenses with your trips."
            />
            {nomadlist ? (
              <CardActions
                disableSpacing
                className="SocialNetworksSettingsActions"
              >
                <Button
                  size="small"
                  color="primary"
                  href={`https://nomadlist.com/@${nomadlist["username"]}`}
                >
                  @{nomadlist["username"]}
                  <OpenInNewIcon className={classes.rightIcon} />
                </Button>
                <div>
                  <Button
                    size="small"
                    color="secondary"
                    onClick={() => _removeNomadlist()}
                    style={{ marginRight: 10 }}
                  >
                    Remove
                  </Button>
                  <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    onClick={() => _openNomadlist()}
                  >
                    Edit
                  </Button>
                </div>
              </CardActions>
            ) : (
              <CardActions className={classes.actions} disableSpacing>
                <div></div>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => _openNomadlist()}
                >
                  Set username
                </Button>
              </CardActions>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
