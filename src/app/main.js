/**
 * In this file, we create a React component
 * which incorporates components provided by Material-UI.
 */
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Route, Navigate, Routes, useSearchParams } from "react-router-dom";
import moment from "moment";

import axios from "axios";
import encryption from "./encryption";

import { SERVER_LOAD, SERVER_LOADED } from "./constants";

import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';

import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'

import { useLocation } from 'react-router-dom';

import Card from "@mui/material/Card";

import ErrorBoundary from "./components/errors/ErrorBoundary";
import BugReport from "./components/errors/BugReport";

import SyncButton from "./components/accounts/SyncButton";
import AccountSelector from "./components/accounts/AccountSelector";
import CurrencySelector from "./components/currency/CurrencySelector";
import UserButton from "./components/settings/UserButton";
import SnackbarsManager from "./components/snackbars/SnackbarsManager";

// Component for router
import Navigation from "./components/Navigation";
import Dashboard from "./components/Dashboard";
import Transactions from "./components/Transactions";
import Report from "./components/Report";
import Changes from "./components/Changes";
import Categories from "./components/Categories";
import CategoriesSuggestions from './components/categories/CategoriesSuggestions';
import Settings from "./components/Settings";
import Reset from "./components/Reset";
import ResetPassword from "./components/ResetPassword";
import Search from "./components/Search";
import Convertor from "./components/Convertor";
import Nomadlist from "./components/Nomadlist";
import NotFound from "./components/NotFound";
import Layout from "./components/Layout";

// Get started section
import GetStarted from "./components/welcoming/GetStarted";
import SelectAccountType from "./components/welcoming/SelectAccountType";
import CreateAccount from "./components/welcoming/CreateAccount";
import ImportAccount from "./components/welcoming/ImportAccount";
import LoginForm from "./components/welcoming/LoginForm";
import ServerForm from "./components/login/ServerForm";
import ForgottenPasswordForm from "./components/login/ForgottenPasswordForm";

import AppActions from "./actions/AppActions";
import ServerActions from "./actions/ServerActions";
import TransactionActions from "./actions/TransactionActions";

import { useTheme } from "./theme";

import { Workbox } from "workbox-window";

import AccountsSettings from "./components/settings/AccountsSettings";
import ProfileSettings from "./components/settings/ProfileSettings";
import HelpSettings from "./components/settings/HelpSettings";
import ServerSettings from "./components/settings/ServerSettings";
import AppSettings from "./components/settings/AppSettings";
import DevelopmentSettings from "./components/settings/DevelopmentSettings";
import SecuritySettings from "./components/settings/SecuritySettings";
import CurrenciesSettings from "./components/settings/CurrenciesSettings";
import ImportExportSettings from "./components/settings/ImportExportSettings";
import ThemeSettings from "./components/settings/ThemeSettings";
import SubscriptionSettings from "./components/settings/SubscriptionSettings";
import SocialNetworksSettings from "./components/settings/SocialNetworksSettings";
import SignInSignUp from "./components/settings/SignInSignUp";
import ForceBugReport from "./components/errors/ForceBugReport";

import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

import { createBrowserHistory } from "history";
const history = createBrowserHistory();

import "./main.scss";
let serviceWorkerRegistration;

// register Swiper custom elements. should be done only once
// and it registers Swiper custom elements globally.
import { register } from 'swiper/element/bundle';
register();

/**
 * Main component is our root component which handle most loading events
 * Only load once, and should in theory never unmount.
 */
export const Main = () => {
  const dispatch = useDispatch();

  // hasAccount is used to define some basic behaviour if user need to create an account
  const hasAccount = useSelector(
    (state) => (state.accounts.remote.length + state.accounts.local.length) >= 1
  );
  const hasMoreThanOneAccount = useSelector(
    (state) => (state.accounts.remote.length + state.accounts.local.length) > 1
  );

  //
  // Handle Axios configuration and listenners
  //
  const baseURL = useSelector((state) => (state.server ? state.server.url : ""));
  let serviceWorkerIgnoreUpdate = false;

  axios.defaults.baseURL = baseURL;
  axios.defaults.timeout = 50000; // Default timeout for every request
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error && error.response && error.response.status === 503) {
        dispatch(ServerActions.maintenance());
      }
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    // On every url update from redux, we update axios default baseURL
    axios.defaults.baseURL = baseURL;
  }, [baseURL]);

  //
  // Deal with VISIBILITY events to show WElcome back and update if needed
  //

  const lastSync = useSelector((state) => state.server.last_sync);
  const lastSeen = useSelector((state) => state.app.last_seen);
  const autoSync = useSelector((state) =>
    Boolean(
      state &&
        state.account &&
        state.account.preferences &&
        state.account.preferences.autoSync
    )
  );

  useEffect(() => {
    // Using Page visibility API
    // https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
    var hidden, visibilityChange;
    if (typeof document.hidden !== "undefined") {
      // Opera 12.10 and Firefox 18 and later support
      hidden = "hidden";
      visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChange = "webkitvisibilitychange";
    }

    function handleVisibilityChange() {
      if (!document[hidden]) {
        const minutes = moment().diff(moment(lastSync), "minutes");
        if (autoSync && lastSync && minutes >= 60) {
          dispatch(ServerActions.sync());
        }
        const minutes_last_seen = moment().diff(moment(lastSeen), "minutes");
        if (minutes_last_seen > 60 * 24 * 2) {
          dispatch(AppActions.snackbar("Welcome back 👋"));
          dispatch(AppActions.lastSeen());
        } else if (minutes_last_seen >= 1) {
          dispatch(AppActions.lastSeen());
        }

        if (serviceWorkerRegistration) {
          serviceWorkerRegistration.update();
        }
      }
    }
    document.addEventListener(visibilityChange, handleVisibilityChange, false);
    handleVisibilityChange();

    return () => {
      document.removeEventListener(visibilityChange, handleVisibilityChange);
    };
  }, [lastSync, lastSeen]);

  //
  // Handle redirect and URL Listenner
  //
  const path = useSelector((state) => state.app.url);
  const transactions = useSelector((state) => state.transactions);

  // Set server on start
  const [queryParameters] = useSearchParams()
  const server = useSelector((state) => state.server);

  useEffect(() => {

    moment.updateLocale("en", { week: {
      dow: 1, // First day of week is Monday
    }});

    if (queryParameters.get('server')) {
      if (!server.isLogged) {
        dispatch(ServerActions.connect(queryParameters.get('server')));
      }
    }

    // Listen to history events to catch all navigation including browser navigation buttons
    const removeListener = history.listen((location) => {
      dispatch(AppActions.navigate(location.pathname));
    });

    // REFRESH transaction if needed
    if (transactions === null && account) {
      dispatch({
        type: SERVER_LOAD,
      });
      dispatch(TransactionActions.refresh()).then(() => {
        dispatch({
          type: SERVER_LOADED,
        });
      });
    }

    //
    // Handle listenner to notify serviceworker onupdatefound event with a snackbar
    //

    // Connect with workbox to display snackbar when update is available.
    if (process.env.NODE_ENV != "development" && "serviceWorker" in navigator) {
      const workbox = new Workbox("/service-worker.js");
      workbox.addEventListener("waiting", (event) => {
        workbox.addEventListener("controlling", (event) => {
          AppActions.reload();
        });

        dispatch(
          AppActions.cacheDidUpdate(() => {
            workbox.messageSW({ type: "SKIP_WAITING" });
          })
        );
      });
      workbox
        .register()
        .then((registration) => {
          if (registration.installing) {
            serviceWorkerIgnoreUpdate = true;
          }
          serviceWorkerRegistration = registration;
          serviceWorkerRegistration.onupdatefound = (event) => {
            if (!serviceWorkerIgnoreUpdate) {
              serviceWorkerRegistration
                .unregister()
                .then((_) => {
                  dispatch(
                    AppActions.cacheDidUpdate(() => {
                      AppActions.reload();
                    })
                  );
                })
                .catch((registrationError) => {
                  console.log("SW registration failed: ", registrationError);
                });
            } else {
              serviceWorkerIgnoreUpdate = false;
            }
          };
          window.onerror = function () {
            console.error("Unregister serviceworker");
            serviceWorkerRegistration.unregister();
          };
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError);
        });
    }

    return () => {
      removeListener();
    };
  }, []);

  //
  // Handle cipher   update for security
  //
  const cipher = useSelector((state) => (state.user ? state.user.cipher : ""));
  useEffect(() => {
    if (cipher) {
      encryption.key(cipher);
    }
  }, [cipher]);

  //
  // Load variable for rendering only
  //

  // Load theme to inject in MuiThemeProvider
  const theme = useTheme();
  // Current selected account to show/hide some elements if account.isLocal
  const account = useSelector((state) => state.account);
  // Disable some UI element if app is syncing
  const isSyncing = useSelector(
    (state) => state.state.isSyncing || state.state.isLoading
  );
  // year
  const year = new Date().getFullYear();
  // month
  const month = new Date().getMonth() + 1;

  //
  // Modal logic
  //
  const [modalComponent, setModalComponent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = (component) => {
    if (component) {
      setModalComponent(component);
      setIsModalOpen(true);
    } else {
      setTimeout(() => {
        setModalComponent(null);
      }, 200);
      setIsModalOpen(false);
    }
  };

  let location = useLocation();
  useEffect(() => {
    if (isModalOpen) {
     toggleModal();
    }
  }, [location]);

  const isDeveloper = useSelector(state => state.app.isDeveloper);

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <ErrorBoundary fallback={<BugReport />}>
            <div id="appContainer">
              <div id="safeAreaInsetTop"></div>
              { !hasAccount && <SnackbarsManager />}
              { !hasAccount ? (
                <div
                  id="container"
                  style={{
                    flexDirection: 'column'
                  }}
                >
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route path="" element={<GetStarted />} />
                      <Route path="select-account-type" element={<SelectAccountType />} />
                      <Route path="create-account" element={<CreateAccount />} />
                      <Route path="import-account" element={<ImportAccount />} />
                      <Route path="login" element={<LoginForm />} />
                      <Route path="server" element={<ServerForm />} />
                      <Route path="password/reset" element={<ForgottenPasswordForm />} />
                      <Route path="resetpassword" element={<ResetPassword />} />
                      <Route path="*" element={<Navigate replace to={`/`} />} />
                    </Route>
                  </Routes>
                </div>
                ) : (
                <div id="container">
                  <aside className="navigation">
                    <Navigation />
                  </aside>

                  <div id="content">
                    <Stack id="toolbar" className="hideMobile" direction="row" spacing={0.5}>
                      {hasAccount && (<>
                        {!account.isLocal && (<>
                          <SyncButton className="showDesktop" />
                          <Divider className="showDesktop"></Divider>
                        </>)}
                          { hasMoreThanOneAccount && (<AccountSelector
                            disabled={isSyncing}
                            className="showDesktop"
                          />) }
                          <CurrencySelector
                            disabled={isSyncing}
                            display="code"
                            className="showDesktop"
                            onModal={toggleModal}
                          />
                      </>)}
                      <Divider orientation="vertical" className="showDesktop"/>
                      <UserButton onModal={toggleModal} />
                    </Stack>
                    <main style={{ position: "relative", flexGrow: 1 }}>

                      <div className={"modalContent " + (isModalOpen ? "open" : "")}>
                        <Card square className="modalContentCard">
                          { modalComponent }
                        </Card>
                      </div>

                      <Routes>
                        <Route path="/" element={<Layout />}>
                          <Route path="login" element={<Navigate replace to={`/dashboard`} />} />
                          <Route path="dashboard" element={<Dashboard onModal={toggleModal} />} />
                          <Route path="report" element={<Report onModal={toggleModal} />} />
                          <Route path="transactions" element={<Navigate replace to={`/transactions/${year}/${month}`} />} />
                            <Route
                              path="/transactions/:year/:month"
                              element={<Transactions onModal={toggleModal} />}
                            />
                            <Route
                              path="/transactions/:year/:month/:day"
                              element={<Transactions onModal={toggleModal} />}
                            />
                          <Route path="categories" element={<Categories onModal={toggleModal} />}>
                            <Route path="suggestions" element={<CategoriesSuggestions />} />
                            <Route path=":id" element={<Categories onModal={toggleModal} />} />
                          </Route>
                          <Route path="changes" element={<Changes onModal={toggleModal} />}>
                            <Route path=":id" element={<Changes onModal={toggleModal} />} />
                          </Route>
                          <Route path="search" element={<Search onModal={toggleModal} />} />
                          <Route path="convertor" element={<Convertor onModal={toggleModal} />} />
                          <Route path="nomadlist" element={<Nomadlist onModal={toggleModal} />}>
                            <Route path="trip/:id" element={<Nomadlist />} />
                            <Route path="city/:slug" element={<Nomadlist />} />
                            <Route path="country/:slug" element={<Nomadlist />} />
                          </Route>
                          <Route path="settings" element={<Settings onModal={toggleModal} />}>
                            <Route path="profile" element={<ProfileSettings onModal={toggleModal} />}/>
                            <Route path="accounts" element={<AccountsSettings onModal={toggleModal} />}/>
                            <Route path="currencies" element={<CurrenciesSettings />} />
                            <Route path="login" element={<SignInSignUp onModal={toggleModal} />} />
                            <Route path="server" element={<ServerSettings />} />
                            <Route path="security" element={<SecuritySettings onModal={toggleModal}  />} />
                            <Route path="subscription" element={<SubscriptionSettings />} />
                            <Route path="import/export/" element={<ImportExportSettings />} />
                            <Route path="social" element={<SocialNetworksSettings onModal={toggleModal} />}/>
                            <Route path="theme" element={<ThemeSettings />} />
                            <Route path="application" element={<AppSettings />} />
                            { isDeveloper && <Route path="development" element={<DevelopmentSettings />} /> }
                            <Route path="help" element={<HelpSettings />} />
                          </Route>
                          <Route path="reset" element={<Reset />} />
                          <Route path="crash" element={<ForceBugReport />} />
                          <Route path="*" element={<NotFound />} />
                          <Route index element={<Navigate replace to="dashboard" />} />
                        </Route>
                      </Routes>
                    <SnackbarsManager />
                    </main>
                  </div>
                </div>
              )}
            </div>
          </ErrorBoundary>
        </LocalizationProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  );
};