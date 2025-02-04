/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import LinearProgress from "@mui/material/LinearProgress";

import UserActions from "../../../actions/UserActions";

export default function NomadlistForm(props) {
  const dispatch = useDispatch();
  const nomadlist = useSelector(state =>
    state.user.socialNetworks ? state.user.socialNetworks.nomadlist || {} : {}
  );
  const isLogged = useSelector(state => state.server.isLogged);

  const [error, setError] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(nomadlist.username || "");

  const onSubmit = e => {
    if (e) {
      e.preventDefault();
    }

    setIsLoading(true);
    setError([]);

    let promise;

    dispatch(UserActions.updateNomadlist(name))
      .then(() => {
        props.onSubmit();
        setIsLoading(false);
      })
      .catch(exception => {
        if (exception) {
          setError({
            name: exception.message
          });
        } else {
          setError({
            name: `Could not fetch https://nomadlist.com/@${name}.json`
          });
        }
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={onSubmit} className="content">
      <header>
        <h2 style={{ color: "white" }}>Nomadlist</h2>
      </header>
      {isLoading ? <LinearProgress mode="indeterminate" /> : ""}
      <div className="form">
        <TextField
          label="Username"
          disabled={isLoading}
          onChange={event => setName(event.target.value)}
          value={name}
          style={{ width: "100%" }}
          error={Boolean(error.name)}
          helperText={error.name}
          margin="normal"
        />
      </div>
      <footer>
        <Button color='inherit' onClick={() => props.onClose()}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          disabled={isLoading}
          style={{ marginLeft: "8px" }}
        >
          Submit
        </Button>
      </footer>
    </form>
  );
}