import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  CssBaseline,
  Button,
  Card,
  CardContent,
  Grid,
  Link,
} from "@material-ui/core";
import { useNavigate } from "react-router-dom";
import Axios from "axios";
import {BASE_URL} from "../../config/Config";
import styles from "./Authentication.module.css";

const Register = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const onChangeUsername = (e) => {
    const newUsername = e.target.value;
    setUsername(newUsername);

    if (newUsername.length < 4 || newUsername.length > 15) {
      setUsernameError("Username must be between 4 and 15 characters.");
    } else {
      setUsernameError("");
    }
  };

  const onChangePassword = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);

    if (newPassword.length < 6 || newPassword.length > 20) {
      setPasswordError("Password must be between 6 and 20 characters.");
    } else {
      setPasswordError("");
    }
  };

  const onChangeName = (e) => {
    const name = e.target.value;
    setName(name);
  };

  const onChangeEmail = (e) => {
    const email = e.target.value;
    setEmail(email);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!usernameError && !passwordError) {
      const newUser = { username, password, name,email };
      const url = BASE_URL + "/api/auth/register";
      const registerRes = await Axios.post(url, newUser);

      if (registerRes.data.status === "fail") {
        if (!registerRes.data.type) {
          setPasswordError(registerRes.data.message);
          setUsernameError(registerRes.data.message);
        } else if (registerRes.data.type === "username") {
          setUsernameError(registerRes.data.message);
        } else if (registerRes.data.type === "password") {
          setPasswordError(registerRes.data.message);
        }
      } else {
        navigate("/login");
      }
    }
  };

  return (
    <div className={styles.background}>
      <CssBaseline />
      <Grid
        container
        spacing={0}
        direction="column"
        alignItems="flex-end"
        justify="flex-start"
        style={{ minHeight: "100vh", padding: 30 }}
      >
        <Box width="70vh" boxShadow={1}>
          <Card className={styles.paper}>
            <CardContent>
              <Typography component="h1" variant="h5">
                Register
              </Typography>
              <form className={styles.form} onSubmit={onSubmit}>
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="name"
                    label="Name"
                    name="name"
                    autoComplete="FirstName LastName"
                    error={usernameError.length > 0 ? true : false}
                    value={name}
                    onChange={onChangeName}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email"
                    name="email"
                    autoComplete="test@test.com"
                    error={email.length > 0 ? true : false}
                    value={email}
                    onChange={onChangeEmail}
                />
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  id="username"
                  label="Username"
                  name="username"
                  autoComplete="username"
                  error={usernameError.length > 0 ? true : false}
                  helperText={usernameError}
                  value={username}
                  onChange={onChangeUsername}
                />
                <TextField
                  variant="outlined"
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  error={passwordError.length > 0 ? true : false}
                  helperText={passwordError}
                  value={password}
                  onChange={onChangePassword}
                />
                <Box display="flex" justifyContent="center">
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    className={styles.submit}
                  >
                    Register
                  </Button>
                </Box>
              </form>
              <Grid container justify="center">
                <Grid item>
                  <Link href="/login" variant="body2" style={{paddingRight: 20}}>
                    Sign In
                  </Link>
                  |
                  <Link href="/login" variant="body2" style={{paddingLeft: 20}}>
                    Forgot Password
                  </Link>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </Grid>
    </div>
  );
};

export default Register;
