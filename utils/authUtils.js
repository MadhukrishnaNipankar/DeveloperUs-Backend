const axios = require("axios");
const AppError = require("./appError");

// Google Auth Utils
exports.getGoogleOAuthTokens = async (code) => {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID,
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  };

  try {
    const res = await axios.post(url, new URLSearchParams(values).toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    return res.data;
  } catch (error) {
    console.log(error, "Failed to fetch google Oauth Tokens");
  }
};

// Github Auth Utils
exports.getGithubOAuthTokens = async (code) => {
  const url = "https://github.com/login/oauth/access_token";
  const values = {
    code,
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
    client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.GITHUB_OAUTH_REDIRECT_URI,
  };
  try {
    const res = await axios.post(url, new URLSearchParams(values).toString(), {
      headers: {
        Accept: "application/json",
      },
    });
    return res.data;
  } catch (error) {
    console.log(error, "Failed to fetch github Oauth Token");
  }
};

exports.getGithubUser = async (accessToken) => {
  const url = "https://api.github.com/user";
  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (res.data.email === null) {
      res.data.email = await getGithubUserEmail(accessToken);
    }
    return res.data;
  } catch (error) {
    console.log(error, "Failed to fetch github user");
    return new AppError(
      "Failed to fetch github user. Please try a different login method",
      500
    );
  }
};

const getGithubUserEmail = async (accessToken) => {
  const url = "https://api.github.com/user/emails";
  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data[0].email;
  } catch (error) {
    console.log(error, "Failed to fetch github email");
    return new AppError(
      "Failed to fetch github email. Please try a different login method",
      500
    );
  }
};

// Linkedin Auth Utils
exports.getLinkedinToken = async (code) => {
  const url = "https://www.linkedin.com/oauth/v2/accessToken";
  const values = {
    code,
    client_id: process.env.LINKEDIN_OAUTH_CLIENT_ID,
    client_secret: process.env.LINKEDIN_OAUTH_CLIENT_SECRET,
    redirect_uri: process.env.LINKEDIN_OAUTH_REDIRECT_URI,
    grant_type: "authorization_code",
  };

  try {
    const res = await axios.post(url, new URLSearchParams(values).toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    });
    return res.data;
  } catch (error) {
    console.log(error, "Failed to fetch linkedin Tokens");
  }
};

exports.getLinkedinUser = async (accessToken) => {
  const url = "https://api.linkedin.com/v2/me";
  try {
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return res.data;
  } catch (error) {
    console.log(error, "Failed to fetch linkedin user");
    return new AppError(
      "Failed to fetch linkedin user. Please try a different login method",
      500
    );
  }
};
